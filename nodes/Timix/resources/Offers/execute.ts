import type { IDataObject, IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { uploadBinaryProperties } from '../Files/helpers';
import { responseToExecutionData, timixApiRequest } from '../shared';
import {
	buildCreateOfferPayload,
	describeOfferApiError,
	extractUploadedFileUuids,
	getApiErrorDetails,
	OFFER_TYPE_BY_OPERATION,
	OFFER_UPLOAD_FOLDER,
	parseAttachmentPropertyNames,
} from './helpers';
import type { OfferRequestStage, OfferType } from './helpers';

const toValidationError = (context: IExecuteFunctions, itemIndex: number, error: unknown) =>
	new NodeOperationError(context.getNode(), (error as Error).message, { itemIndex });

/** Turn an HTTP error into a clear NodeApiError; anything without a status is rethrown as is. */
const toApiError = (
	context: IExecuteFunctions,
	itemIndex: number,
	error: unknown,
	stage: OfferRequestStage,
	type: OfferType,
): unknown => {
	const details = getApiErrorDetails(error);
	if (details.status === undefined) return error;

	const { message, description } = describeOfferApiError(stage, type, details);
	const httpCode = String(details.status);
	return new NodeApiError(
		context.getNode(),
		{ message: details.message ?? message, httpCode } as JsonObject,
		{ message, description, httpCode, itemIndex },
	);
};

export async function executeOffer(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const type = OFFER_TYPE_BY_OPERATION[operation];
	if (!type) {
		throw new NodeOperationError(this.getNode(), `Unsupported offer operation: ${operation}`, {
			itemIndex,
		});
	}

	const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, false) as boolean;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
	const input = {
		type,
		title: this.getNodeParameter('title', itemIndex, ''),
		description: this.getNodeParameter('description', itemIndex, ''),
		anonymity: this.getNodeParameter('anonymity', itemIndex, true),
		solution:
			type === 'complaint'
				? this.getNodeParameter('solution', itemIndex, '')
				: additionalFields.solution,
	};

	// Validate everything before the first request so an invalid item never uploads files.
	let attachmentNames: string[];
	try {
		buildCreateOfferPayload(input);
		attachmentNames = parseAttachmentPropertyNames(additionalFields.attachments);
	} catch (error) {
		throw toValidationError(this, itemIndex, error);
	}

	let fileUuids: string[] = [];
	if (attachmentNames.length > 0) {
		let uploadResponse: unknown;
		try {
			uploadResponse = await uploadBinaryProperties(
				this,
				itemIndex,
				OFFER_UPLOAD_FOLDER,
				attachmentNames,
			);
		} catch (error) {
			throw toApiError(this, itemIndex, error, 'upload', type);
		}

		try {
			fileUuids = extractUploadedFileUuids(uploadResponse);
		} catch (error) {
			throw toValidationError(this, itemIndex, error);
		}
		if (fileUuids.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				`Attachment upload returned no file UUIDs, so the ${type} was not created`,
				{ itemIndex },
			);
		}
	}

	const payload = buildCreateOfferPayload({ ...input, fileUuids });

	// POST /offers is not idempotent (each call creates a record and sends notifications),
	// so there is intentionally no retry here.
	let response: unknown;
	try {
		response = await timixApiRequest(this, itemIndex, {
			method: 'POST',
			url: '/api/v2/offers',
			body: payload,
			json: true,
		});
	} catch (error) {
		throw toApiError(this, itemIndex, error, 'create', type);
	}

	return responseToExecutionData(response, itemIndex, includeMetadata);
}
