import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { timixApiRequest } from '../shared';

export async function resolveTarget(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const targetType = this.getNodeParameter('targetType', itemIndex) as string;
	const targetUuid = this.getNodeParameter('targetUuid', itemIndex) as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: '/api/v2/chat/targets/resolve',
		body: {
			type: targetType,
			uuid: targetUuid,
		},
		json: true,
	};

	const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);
	return [{ json: response, pairedItem: { item: itemIndex } }];
}
