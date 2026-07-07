import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	extractCollectionValues,
	normalizeOptionalString,
	normalizeUuidList,
	timixApiRequest,
} from '../shared';

export async function sendMessage(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const conversationUuid = this.getNodeParameter('conversationUuid', itemIndex) as string;
	const messageType = this.getNodeParameter('messageType', itemIndex, 'text') as string;
	const content = this.getNodeParameter('content', itemIndex, '') as string;

	const fileUuids = normalizeUuidList(
		extractCollectionValues(this.getNodeParameter('fileUuids', itemIndex, {}), 'uuid'),
	);
	const mentionEmployeeUuids = normalizeUuidList(
		extractCollectionValues(this.getNodeParameter('mentionEmployeeUuids', itemIndex, {}), 'uuid'),
	);
	const mentionDivisionUuids = normalizeUuidList(
		extractCollectionValues(this.getNodeParameter('mentionDivisionUuids', itemIndex, {}), 'uuid'),
	);
	const mentionDepartmentUuids = normalizeUuidList(
		extractCollectionValues(
			this.getNodeParameter('mentionDepartmentUuids', itemIndex, {}),
			'uuid',
		),
	);
	const mentionGroupUuids = normalizeUuidList(
		extractCollectionValues(this.getNodeParameter('mentionGroupUuids', itemIndex, {}), 'uuid'),
	);
	const mentionJobUuids = normalizeUuidList(
		extractCollectionValues(this.getNodeParameter('mentionJobUuids', itemIndex, {}), 'uuid'),
	);

	const trimmedContent = content.trim();
	if (trimmedContent.length === 0 && fileUuids.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Provide message content or at least one file UUID',
			{ itemIndex },
		);
	}

	if ((messageType === 'file' || messageType === 'audio') && fileUuids.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			`Message type "${messageType}" requires at least one file UUID`,
			{ itemIndex },
		);
	}

	const payload: IDataObject = {
		type: messageType,
	};

	if (trimmedContent.length > 0) {
		payload.content = trimmedContent;
	}
	if (fileUuids.length > 0) {
		payload.fileUuids = fileUuids;
	}

	const optionalFields: Array<[string, unknown]> = [
		['replyToMessageUuid', this.getNodeParameter('replyToMessageUuid', itemIndex, '')],
		['threadRootMessageUuid', this.getNodeParameter('threadRootMessageUuid', itemIndex, '')],
		['scheduledAt', this.getNodeParameter('scheduledAt', itemIndex, '')],
		['expiresAt', this.getNodeParameter('expiresAt', itemIndex, '')],
		['outBoxPattern', this.getNodeParameter('outBoxPattern', itemIndex, '')],
	];

	for (const [key, value] of optionalFields) {
		const normalized = normalizeOptionalString(value);
		if (normalized) {
			payload[key] = normalized;
		}
	}

	const mentionAll = this.getNodeParameter('mentionAll', itemIndex, false) as boolean;
	if (mentionAll) {
		payload.mentionAll = true;
	}
	if (mentionEmployeeUuids.length > 0) {
		payload.mentionEmployeeUuids = mentionEmployeeUuids;
	}
	if (mentionDivisionUuids.length > 0) {
		payload.mentionDivisionUuids = mentionDivisionUuids;
	}
	if (mentionDepartmentUuids.length > 0) {
		payload.mentionDepartmentUuids = mentionDepartmentUuids;
	}
	if (mentionGroupUuids.length > 0) {
		payload.mentionGroupUuids = mentionGroupUuids;
	}
	if (mentionJobUuids.length > 0) {
		payload.mentionJobUuids = mentionJobUuids;
	}

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `/api/v2/chat/conversations/${conversationUuid}/messages`,
		body: payload,
		json: true,
	};

	const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);
	return [{ json: response, pairedItem: { item: itemIndex } }];
}
