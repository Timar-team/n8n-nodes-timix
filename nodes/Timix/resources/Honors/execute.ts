import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	normalizeOptionalString,
	responseToExecutionData,
	timixApiRequest,
	unwrapHrPayload,
} from '../shared';
import { buildCreateHonorPayload, buildUpdateHonorPayload } from './helpers';

const getRequiredUuid = (
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	label: string,
): string => {
	const value = normalizeOptionalString(context.getNodeParameter(parameterName, itemIndex));
	if (!value)
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	return value;
};

async function getAllHonors(
	context: IExecuteFunctions,
	itemIndex: number,
	query: IDataObject,
): Promise<{ payload: IDataObject[]; pages: number; lastResponse: unknown }> {
	const pageSize = 100;
	const payload: IDataObject[] = [];
	let offset = 0;
	let pages = 0;
	let lastResponse: unknown = { payload: [] };

	while (pages < 1000) {
		lastResponse = await timixApiRequest(context, itemIndex, {
			method: 'GET',
			url: '/api/v2/honors',
			qs: { ...query, limit: pageSize, offset },
			json: true,
		});
		const page = unwrapHrPayload(lastResponse);
		if (!Array.isArray(page)) {
			throw new NodeOperationError(context.getNode(), 'Expected the honors API to return a list', {
				itemIndex,
			});
		}
		payload.push(...(page as IDataObject[]));
		pages += 1;
		if (page.length < pageSize) break;
		offset += pageSize;
	}

	if (pages === 1000) {
		throw new NodeOperationError(context.getNode(), 'Honor pagination exceeded 1000 pages', {
			itemIndex,
		});
	}

	return { payload, pages, lastResponse };
}

export async function executeHonor(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, false) as boolean;
	let requestOptions: IHttpRequestOptions;

	if (operation === 'create') {
		const payload = buildCreateHonorPayload({
			title: this.getNodeParameter('title', itemIndex) as string,
			description: this.getNodeParameter('description', itemIndex) as string,
			priority: this.getNodeParameter('priority', itemIndex, 0) as number,
			fileUuid: this.getNodeParameter('fileUuid', itemIndex, ''),
		});
		requestOptions = { method: 'POST', url: '/api/v2/honors', body: payload, json: true };
	} else if (operation === 'get') {
		const honorUuid = getRequiredUuid(this, itemIndex, 'honorUuid', 'Honor UUID');
		requestOptions = { method: 'GET', url: `/api/v2/honors/${honorUuid}`, json: true };
	} else if (operation === 'update') {
		const honorUuid = getRequiredUuid(this, itemIndex, 'honorUuid', 'Honor UUID');
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
			string,
			unknown
		>;
		const payload = buildUpdateHonorPayload({
			updateFields,
			fileAction: this.getNodeParameter('fileAction', itemIndex, 'keep') as string,
			fileUuid: this.getNodeParameter('newFileUuid', itemIndex, ''),
		});
		requestOptions = {
			method: 'PATCH',
			url: `/api/v2/honors/${honorUuid}`,
			body: payload,
			json: true,
		};
	} else if (operation === 'delete') {
		const honorUuid = getRequiredUuid(this, itemIndex, 'honorUuid', 'Honor UUID');
		requestOptions = { method: 'DELETE', url: `/api/v2/honors/${honorUuid}`, json: true };
	} else if (operation === 'getMany') {
		const query: IDataObject = {
			sortBy: this.getNodeParameter('sortBy', itemIndex, 'createdAt') as string,
			sortAs: this.getNodeParameter('sortAs', itemIndex, 'DESC') as string,
		};
		const search = normalizeOptionalString(this.getNodeParameter('search', itemIndex, ''));
		if (search) query.search = search;

		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		if (returnAll) {
			const result = await getAllHonors(this, itemIndex, query);
			if (includeMetadata) {
				const metadata =
					result.lastResponse && typeof result.lastResponse === 'object'
						? (result.lastResponse as IDataObject)
						: {};
				return responseToExecutionData(
					{ ...metadata, payload: result.payload, pages: result.pages },
					itemIndex,
					true,
				);
			}
			return responseToExecutionData({ payload: result.payload }, itemIndex);
		}

		query.limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		query.offset = this.getNodeParameter('offset', itemIndex, 0) as number;
		requestOptions = { method: 'GET', url: '/api/v2/honors', qs: query, json: true };
	} else {
		throw new NodeOperationError(this.getNode(), `Unsupported honor operation: ${operation}`, {
			itemIndex,
		});
	}

	const response = await timixApiRequest(this, itemIndex, requestOptions);
	return responseToExecutionData(response, itemIndex, includeMetadata);
}
