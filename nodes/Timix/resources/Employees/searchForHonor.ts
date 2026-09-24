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
	responseToExecutionData,
	timixApiRequest,
} from '../shared';

export async function searchEmployeesForHonor(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const search = normalizeOptionalString(this.getNodeParameter('search', itemIndex));
	if (!search) {
		throw new NodeOperationError(this.getNode(), 'Search is required', { itemIndex });
	}

	const query: IDataObject = {
		search,
		actionModel: 'employee_honors',
		actionType: 'C',
		excludeMe: this.getNodeParameter('excludeMe', itemIndex, false) as boolean,
	};
	const employeeTypes = extractCollectionValues(
		this.getNodeParameter('employeeTypes', itemIndex, {}),
		'type',
	);
	if (employeeTypes.length > 0) query.type = employeeTypes;

	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: '/api/v2/employees/action-model',
		qs: query,
		arrayFormat: 'repeat',
		json: true,
	};
	const response = await timixApiRequest(this, itemIndex, requestOptions);
	const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, false) as boolean;

	return responseToExecutionData(response, itemIndex, includeMetadata);
}
