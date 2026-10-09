import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { timixApiRequest } from '../shared';
import { buildAddMessageReactionPayload } from './helpers';

export async function addMessageReaction(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const messageUuid = (this.getNodeParameter('messageUuid', itemIndex) as string).trim();
	if (messageUuid.length === 0) {
		throw new Error('Message UUID is required');
	}

	const payload = buildAddMessageReactionPayload(
		this.getNodeParameter('reaction', itemIndex) as string,
	);
	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `/api/v2/chat/messages/${encodeURIComponent(messageUuid)}/reactions`,
		body: payload,
		json: true,
	};

	const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);
	return [{ json: response, pairedItem: { item: itemIndex } }];
}
