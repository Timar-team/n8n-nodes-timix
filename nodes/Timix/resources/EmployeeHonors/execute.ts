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
	responseToExecutionData,
	timixApiRequest,
	unwrapHrPayload,
} from '../shared';
import { buildAssignHonorPayload, buildUpdateAssignmentPayload } from './helpers';

const getRequiredAssignmentUuid = (context: IExecuteFunctions, itemIndex: number): string => {
	const value = normalizeOptionalString(context.getNodeParameter('assignmentUuid', itemIndex));
	if (!value) {
		throw new NodeOperationError(context.getNode(), 'Assignment UUID is required', {
			itemIndex,
		});
	}
	return value;
};

const getFilterUuids = (
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
): string[] =>
	normalizeUuidList(
		extractCollectionValues(context.getNodeParameter(parameterName, itemIndex, {}), 'uuid'),
	);

async function getAllAssignments(
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
			url: '/api/v2/employee-honors',
			qs: { ...query, limit: pageSize, offset },
			arrayFormat: 'repeat',
			json: true,
		});
		const page = unwrapHrPayload(lastResponse);
		if (!Array.isArray(page)) {
			throw new NodeOperationError(
				context.getNode(),
				'Expected the employee honors API to return a list',
				{ itemIndex },
			);
		}
		payload.push(...(page as IDataObject[]));
		pages += 1;
		if (page.length < pageSize) break;
		offset += pageSize;
	}

	if (pages === 1000) {
		throw new NodeOperationError(
			context.getNode(),
			'Employee honor pagination exceeded 1000 pages',
			{ itemIndex },
		);
	}

	return { payload, pages, lastResponse };
}

export async function executeEmployeeHonor(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, false) as boolean;
	let requestOptions: IHttpRequestOptions;

	if (operation === 'assign') {
		const employeeUuids = getFilterUuids(this, itemIndex, 'employeeUuids');
		const payload = buildAssignHonorPayload({
			honorUuid: this.getNodeParameter('honorUuid', itemIndex) as string,
			employeeUuids,
			expiresAt: this.getNodeParameter('expiresAt', itemIndex, ''),
			expiryText: this.getNodeParameter('expiryText', itemIndex, ''),
			isActive: this.getNodeParameter('isActive', itemIndex, true) as boolean,
		});
		requestOptions = {
			method: 'POST',
			url: '/api/v2/employee-honors',
			body: payload,
			json: true,
		};
	} else if (operation === 'get') {
		const assignmentUuid = getRequiredAssignmentUuid(this, itemIndex);
		requestOptions = {
			method: 'GET',
			url: `/api/v2/employee-honors/${assignmentUuid}`,
			json: true,
		};
	} else if (operation === 'update') {
		const assignmentUuid = getRequiredAssignmentUuid(this, itemIndex);
		const payload = buildUpdateAssignmentPayload({
			expiresAtAction: this.getNodeParameter('expiresAtAction', itemIndex, 'keep') as string,
			expiresAt: this.getNodeParameter('newExpiresAt', itemIndex, ''),
			expiryTextAction: this.getNodeParameter('expiryTextAction', itemIndex, 'keep') as string,
			expiryText: this.getNodeParameter('newExpiryText', itemIndex, ''),
			isActiveAction: this.getNodeParameter('isActiveAction', itemIndex, 'keep') as string,
		});
		requestOptions = {
			method: 'PATCH',
			url: `/api/v2/employee-honors/${assignmentUuid}`,
			body: payload,
			json: true,
		};
	} else if (operation === 'remove') {
		const assignmentUuid = getRequiredAssignmentUuid(this, itemIndex);
		requestOptions = {
			method: 'DELETE',
			url: `/api/v2/employee-honors/${assignmentUuid}`,
			json: true,
		};
	} else if (operation === 'getMany') {
		const query: IDataObject = {
			sortBy: this.getNodeParameter('sortBy', itemIndex, 'createdAt') as string,
			sortAs: this.getNodeParameter('sortAs', itemIndex, 'DESC') as string,
		};
		const employeeUuids = getFilterUuids(this, itemIndex, 'employeeUuidFilters');
		const honorUuids = getFilterUuids(this, itemIndex, 'honorUuidFilters');
		const search = normalizeOptionalString(this.getNodeParameter('search', itemIndex, ''));
		const activeFilter = this.getNodeParameter('activeFilter', itemIndex, 'any') as string;
		if (employeeUuids.length > 0) query.employeeUuids = employeeUuids;
		if (honorUuids.length > 0) query.honorUuids = honorUuids;
		if (search) query.search = search;
		if (activeFilter !== 'any') query.active = activeFilter === 'true';

		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		if (returnAll) {
			const result = await getAllAssignments(this, itemIndex, query);
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
		requestOptions = {
			method: 'GET',
			url: '/api/v2/employee-honors',
			qs: query,
			arrayFormat: 'repeat',
			json: true,
		};
	} else {
		throw new NodeOperationError(
			this.getNode(),
			`Unsupported employee honor operation: ${operation}`,
			{ itemIndex },
		);
	}

	const response = await timixApiRequest(this, itemIndex, requestOptions);
	return responseToExecutionData(response, itemIndex, includeMetadata);
}
