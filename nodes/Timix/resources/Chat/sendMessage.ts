import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { timixApiRequest } from '../shared';
import { buildSendMessagePayload, getUuidListParameter } from './helpers';

export async function sendMessage(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const conversationUuid = this.getNodeParameter('conversationUuid', itemIndex) as string;
	const messageType = this.getNodeParameter('messageType', itemIndex, 'text') as string;
	const payload = buildSendMessagePayload({
		messageType,
		content: this.getNodeParameter('content', itemIndex, '') as string,
		fileUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'fileUuids',
		),
		replyToMessageUuid: this.getNodeParameter('replyToMessageUuid', itemIndex, ''),
		threadRootMessageUuid: this.getNodeParameter('threadRootMessageUuid', itemIndex, ''),
		scheduledAt: this.getNodeParameter('scheduledAt', itemIndex, ''),
		expiresAt: this.getNodeParameter('expiresAt', itemIndex, ''),
		outBoxPattern: this.getNodeParameter('outBoxPattern', itemIndex, ''),
		mentionAll: this.getNodeParameter('mentionAll', itemIndex, true) as boolean,
		mentionEmployeeUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'mentionEmployeeUuids',
		),
		mentionDivisionUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'mentionDivisionUuids',
		),
		mentionDepartmentUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'mentionDepartmentUuids',
		),
		mentionGroupUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'mentionGroupUuids',
		),
		mentionJobUuids: getUuidListParameter(
			(name, defaultValue) => this.getNodeParameter(name, itemIndex, defaultValue),
			'mentionJobUuids',
		),
	});

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `/api/v2/chat/conversations/${conversationUuid}/messages`,
		body: payload,
		json: true,
	};

	const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);
	return [{ json: response, pairedItem: { item: itemIndex } }];
}
