import type { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { timixApiRequest } from '../shared';

export async function searchTargets(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const search = this.getNodeParameter('search', itemIndex) as string;
	const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
	const offset = this.getNodeParameter('offset', itemIndex, 0) as number;

	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: '/api/v2/chat/targets/search',
		qs: {
			search,
			limit,
			offset,
		},
		json: true,
	};

	const response = await timixApiRequest<unknown>(this, itemIndex, requestOptions);
	const records = Array.isArray(response) ? response : [response];

	return records.map((record) => ({
		json: record,
		pairedItem: { item: itemIndex },
	}));
}
