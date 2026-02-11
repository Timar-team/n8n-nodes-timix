import type { IExecuteFunctions, INodeExecutionData, IRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// Normalize comma-separated inputs like "a, b, c" into a clean string list.
const normalizeListFromString = (value: string): string[] =>
	value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

// Collects UUIDs from strings, arrays, or common nested object shapes.
const collectUuids = (value: unknown, output: Set<string>) => {
	const pushUuid = (candidate: unknown) => {
		if (typeof candidate !== 'string') return;
		const trimmed = candidate.trim();
		if (trimmed.length === 0) return;
		const looksJson =
			(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
			(trimmed.startsWith('[') && trimmed.endsWith(']'));
		if (looksJson) {
			try {
				const parsed = JSON.parse(trimmed);
				collectUuids(parsed, output);
				return;
			} catch {
				// Fall through and treat as plain string.
			}
		}
		if (trimmed.includes(',')) {
			for (const entry of normalizeListFromString(trimmed)) {
				output.add(entry);
			}
			return;
		}
		output.add(trimmed);
	};

	const collectFromObject = (obj: Record<string, unknown>) => {
		pushUuid(obj.uuid);
		pushUuid(obj.id);
		if (Array.isArray(obj.data)) {
			for (const item of obj.data) {
				if (item && typeof item === 'object') {
					collectFromObject(item as Record<string, unknown>);
				} else {
					pushUuid(item);
				}
			}
		} else if (Array.isArray(obj.items)) {
			for (const item of obj.items) {
				if (item && typeof item === 'object') {
					collectFromObject(item as Record<string, unknown>);
				} else {
					pushUuid(item);
				}
			}
		}
	};

	if (Array.isArray(value)) {
		for (const item of value) {
			if (item && typeof item === 'object') {
				collectFromObject(item as Record<string, unknown>);
			} else {
				pushUuid(item);
			}
		}
		return;
	}
	if (typeof value === 'string') {
		pushUuid(value);
		return;
	}
	if (value && typeof value === 'object') {
		collectFromObject(value as Record<string, unknown>);
	}
};

// Public helper: normalize any input into a de-duplicated UUID list.
const normalizeUuidList = (value: unknown): string[] => {
	const uuids = new Set<string>();
	collectUuids(value, uuids);
	return Array.from(uuids);
};

// Extract "uuid" values from fixedCollection inputs in n8n.
const extractCollectionValues = (value: unknown, key: string): string[] => {
	if (!value || typeof value !== 'object') return [];
	const obj = value as Record<string, unknown>;
	const entries = obj.values;
	if (!Array.isArray(entries)) return [];
	const out: string[] = [];
	for (const entry of entries) {
		if (entry && typeof entry === 'object') {
			const record = entry as Record<string, unknown>;
			const val = record[key];
			if (typeof val === 'string' && val.trim().length > 0) {
				out.push(val.trim());
			}
		}
	}
	return out;
};

export async function createTask(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	// The node supports both a JSON body and form-driven inputs.
	const bodyContentType = this.getNodeParameter(
		'bodyContentType',
		itemIndex,
		'form',
	) as string;

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
			} catch (error) {
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
		const singleSubmission = this.getNodeParameter(
			'singleSubmission',
			itemIndex,
			false,
		) as boolean;

		const employeeUuidsInput = this.getNodeParameter(
			'employeeUuids',
			itemIndex,
			[],
		);
		const groupUuidsInput = this.getNodeParameter('groupUuids', itemIndex, {});
		const companyUuidsInput = this.getNodeParameter('companyUuids', itemIndex, {});
		const divisionUuidsInput = this.getNodeParameter('divisionUuids', itemIndex, {});
		const departmentUuidsInput = this.getNodeParameter(
			'departmentUuids',
			itemIndex,
			{},
		);
		const fileUuidsInput = this.getNodeParameter('fileUuids', itemIndex, {});

		// Normalize every collection into a de-duplicated UUID list.
		const employeeUuids = normalizeUuidList(
			extractCollectionValues(employeeUuidsInput, 'uuid'),
		);
		const groupUuids = normalizeUuidList(extractCollectionValues(groupUuidsInput, 'uuid'));
		const companyUuids = normalizeUuidList(
			extractCollectionValues(companyUuidsInput, 'uuid'),
		);
		const divisionUuids = normalizeUuidList(
			extractCollectionValues(divisionUuidsInput, 'uuid'),
		);
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

	// Use the shared credential to build a single POST request.
	const credentials = await this.getCredentials('timixHrApi');
	const requestOptions: IRequestOptions = {
		method: 'POST',
		baseURL: credentials.baseUrl as string,
		url: '/api/v2/task',
		body: payload,
		json: true,
	};

	const response = await this.helpers.requestWithAuthentication.call(
		this,
		'timixHrApi',
		requestOptions,
	);

	return [{ json: response, pairedItem: { item: itemIndex } }];
}
