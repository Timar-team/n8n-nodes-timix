import type { IDataObject, IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { responseToExecutionData, timixApiRequest } from '../shared';
import {
	buildCreateOfferPayload,
	describeOfferApiError,
	getApiErrorDetails,
	getOfferFileUuids,
	OFFER_TYPE_BY_OPERATION,
} from './helpers';
import type { OfferType } from './helpers';

/** Turn an HTTP error into a clear NodeApiError; anything without a status is rethrown as is. */
const toApiError = (
	context: IExecuteFunctions,
	itemIndex: number,
	error: unknown,
	type: OfferType,
): unknown => {
	const details = getApiErrorDetails(error);
	if (details.status === undefined) return error;

	const { message, description } = describeOfferApiError(type, details);
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

	// Validate before the request so an invalid item never creates a record.
	let payload: IDataObject;
	try {
		payload = buildCreateOfferPayload({
			type,
			title: this.getNodeParameter('title', itemIndex, ''),
			description: this.getNodeParameter('description', itemIndex, ''),
			anonymity: this.getNodeParameter('anonymity', itemIndex, true),
			solution:
				type === 'complaint'
					? this.getNodeParameter('solution', itemIndex, '')
					: additionalFields.solution,
			fileUuids: getOfferFileUuids(this.getNodeParameter('fileUuids', itemIndex, {})),
		});
	} catch (error) {
		throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex });
	}

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
		throw toApiError(this, itemIndex, error, type);
	}

	return responseToExecutionData(response, itemIndex, includeMetadata);
}
