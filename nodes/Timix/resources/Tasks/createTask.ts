import type { IExecuteFunctions, INodeExecutionData, IRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export async function createTask(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
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

	const topicUuidsInput = this.getNodeParameter('topicUuids', itemIndex, '');
	const newTopicsInput = this.getNodeParameter('newTopics', itemIndex, '');
	const groupUuidsInput = this.getNodeParameter('groupUuids', itemIndex, '');
	const employeeUuidsInput = this.getNodeParameter('employeeUuids', itemIndex, '');
	const companyUuidsInput = this.getNodeParameter('companyUuids', itemIndex, '');
	const divisionUuidsInput = this.getNodeParameter('divisionUuids', itemIndex, '');
	const departmentUuidsInput = this.getNodeParameter('departmentUuids', itemIndex, '');
	const jobUuidsInput = this.getNodeParameter('jobUuids', itemIndex, '');
	const fileUuidsInput = this.getNodeParameter('fileUuids', itemIndex, '');

	const normalizeListFromString = (value: string): string[] =>
		value
			.split(',')
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);

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
					// fall through to push raw string
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

	const normalizeUuidList = (value: unknown): string[] => {
		const uuids = new Set<string>();
		collectUuids(value, uuids);
		return Array.from(uuids);
	};

	const normalizeTopicList = (value: unknown): string[] => {
		if (Array.isArray(value)) {
			return value
				.map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
				.filter((entry) => entry.length > 0);
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed.length === 0) return [];
			const looksJson =
				(trimmed.startsWith('[') && trimmed.endsWith(']')) ||
				(trimmed.startsWith('{') && trimmed.endsWith('}'));
			if (looksJson) {
				try {
					const parsed = JSON.parse(trimmed);
					return normalizeTopicList(parsed);
				} catch {
					return normalizeListFromString(trimmed);
				}
			}
			return normalizeListFromString(trimmed);
		}
		if (value && typeof value === 'object') {
			const obj = value as Record<string, unknown>;
			if (Array.isArray(obj.data)) {
				return normalizeTopicList(obj.data);
			}
		}
		return [];
	};

	const topicUuids = normalizeUuidList(topicUuidsInput);
	const newTopics = normalizeTopicList(newTopicsInput);
	const groupUuids = normalizeUuidList(groupUuidsInput);
	const employeeUuids = normalizeUuidList(employeeUuidsInput);
	const companyUuids = normalizeUuidList(companyUuidsInput);
	const divisionUuids = normalizeUuidList(divisionUuidsInput);
	const departmentUuids = normalizeUuidList(departmentUuidsInput);
	const jobUuids = normalizeUuidList(jobUuidsInput);
	const fileUuids = normalizeUuidList(fileUuidsInput);

	const hasAssignmentScope =
		groupUuids.length > 0 ||
		employeeUuids.length > 0 ||
		companyUuids.length > 0 ||
		divisionUuids.length > 0 ||
		departmentUuids.length > 0;

	if (!hasAssignmentScope) {
		throw new NodeOperationError(
			this.getNode(),
			'At least one of Group UUIDs, Employee UUIDs, Company UUIDs, Division UUIDs, or Department UUIDs must be provided',
			{ itemIndex },
		);
	}

	const payload: Record<string, unknown> = {
		title,
		priority,
		from,
		to,
		singleSubmission,
	};

	if (description.trim().length > 0) {
		payload.description = description.trim();
	}
	if (topicUuids.length > 0) {
		payload.topicUuids = topicUuids;
	}
	if (newTopics.length > 0) {
		payload.newTopics = newTopics;
	}
	if (groupUuids.length > 0) {
		payload.groupUuids = groupUuids;
	}
	if (employeeUuids.length > 0) {
		payload.employeeUuids = employeeUuids;
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
	if (jobUuids.length > 0) {
		payload.jobUuids = jobUuids;
	}
	if (fileUuids.length > 0) {
		payload.fileUuids = fileUuids;
	}

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
