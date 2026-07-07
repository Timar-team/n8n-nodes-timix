import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractCollectionValues, normalizeUuidList, timixApiRequest } from '../shared';

export async function createTask(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	// The node supports both a JSON body and form-driven inputs.
	const bodyContentType = this.getNodeParameter('bodyContentType', itemIndex, 'form') as string;

	let payload: Record<string, unknown> = {};
	let assignmentScope: {
		groupUuids: string[];
		employeeUuids: string[];
		companyUuids: string[];
		divisionUuids: string[];
		departmentUuids: string[];
	} = {
		groupUuids: [],
		employeeUuids: [],
		companyUuids: [],
		divisionUuids: [],
		departmentUuids: [],
	};

	if (bodyContentType === 'json') {
		// JSON mode: accept raw object or stringified JSON from the UI.
		const jsonBody = this.getNodeParameter('jsonBody', itemIndex, {}) as unknown;
		if (typeof jsonBody === 'string') {
			try {
				payload = JSON.parse(jsonBody);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON body', {
					itemIndex,
				});
			}
		} else if (jsonBody && typeof jsonBody === 'object') {
			payload = jsonBody as Record<string, unknown>;
		}

		// The API ignores these fields; keep the payload explicit and minimal.
		delete (payload as Record<string, unknown>).topicUuids;
		delete (payload as Record<string, unknown>).newTopics;

		// Normalize assignment scope regardless of incoming shape.
		assignmentScope = {
			groupUuids: normalizeUuidList(payload.groupUuids),
			employeeUuids: normalizeUuidList(payload.employeeUuids),
			companyUuids: normalizeUuidList(payload.companyUuids),
			divisionUuids: normalizeUuidList(payload.divisionUuids),
			departmentUuids: normalizeUuidList(payload.departmentUuids),
		};
	} else {
		// Form mode: build the payload from individual UI fields.
		const title = this.getNodeParameter('title', itemIndex) as string;
		const description = this.getNodeParameter('description', itemIndex, '') as string;
		const priority = this.getNodeParameter('priority', itemIndex) as number;
		const from = this.getNodeParameter('from', itemIndex) as string;
		const to = this.getNodeParameter('to', itemIndex) as string;
		const singleSubmission = this.getNodeParameter('singleSubmission', itemIndex, false) as boolean;

		const employeeUuidsInput = this.getNodeParameter('employeeUuids', itemIndex, []);
		const groupUuidsInput = this.getNodeParameter('groupUuids', itemIndex, {});
		const companyUuidsInput = this.getNodeParameter('companyUuids', itemIndex, {});
		const divisionUuidsInput = this.getNodeParameter('divisionUuids', itemIndex, {});
		const departmentUuidsInput = this.getNodeParameter('departmentUuids', itemIndex, {});
		const fileUuidsInput = this.getNodeParameter('fileUuids', itemIndex, {});

		// Normalize every collection into a de-duplicated UUID list.
		const employeeUuids = normalizeUuidList(extractCollectionValues(employeeUuidsInput, 'uuid'));
		const groupUuids = normalizeUuidList(extractCollectionValues(groupUuidsInput, 'uuid'));
		const companyUuids = normalizeUuidList(extractCollectionValues(companyUuidsInput, 'uuid'));
		const divisionUuids = normalizeUuidList(extractCollectionValues(divisionUuidsInput, 'uuid'));
		const departmentUuids = normalizeUuidList(
			extractCollectionValues(departmentUuidsInput, 'uuid'),
		);
		const fileUuids = normalizeUuidList(extractCollectionValues(fileUuidsInput, 'uuid'));

		payload = {
			title,
			priority,
			from,
			to,
			singleSubmission,
		};

		// Only include optional fields when they are provided.
		if (description.trim().length > 0) {
			payload.description = description.trim();
		}
		if (employeeUuids.length > 0) {
			payload.employeeUuids = employeeUuids;
		}
		if (groupUuids.length > 0) {
			payload.groupUuids = groupUuids;
		}
		if (companyUuids.length > 0) {
			payload.companyUuids = companyUuids;
		}
		if (divisionUuids.length > 0) {
			payload.divisionUuids = divisionUuids;
		}
		if (departmentUuids.length > 0) {
			payload.departmentUuids = departmentUuids;
		}
		if (fileUuids.length > 0) {
			payload.fileUuids = fileUuids;
		}

		// Keep a scope snapshot for validation.
		assignmentScope = {
			employeeUuids,
			groupUuids,
			companyUuids,
			divisionUuids,
			departmentUuids,
		};
	}

	const hasAssignmentScope =
		assignmentScope.groupUuids.length > 0 ||
		assignmentScope.employeeUuids.length > 0 ||
		assignmentScope.companyUuids.length > 0 ||
		assignmentScope.divisionUuids.length > 0 ||
		assignmentScope.departmentUuids.length > 0;

	if (!hasAssignmentScope) {
		// Task must be assigned to at least one scope in Timix HR.
		throw new NodeOperationError(
			this.getNode(),
			'At least one of Group UUIDs, Employee UUIDs, Company UUIDs, Division UUIDs, or Department UUIDs must be provided',
			{ itemIndex },
		);
	}

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: '/api/v2/tasks',
		body: payload,
		json: true,
	};
	const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);

	return [{ json: response, pairedItem: { item: itemIndex } }];
}
