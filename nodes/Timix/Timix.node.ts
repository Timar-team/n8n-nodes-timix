import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { fileFields, fileOperations } from './resources/Files/description';
import { uploadFile } from './resources/Files/uploadFile';
import { taskFields, taskOperations } from './resources/Tasks/description';
import { createTask } from './resources/Tasks/createTask';
import { getTasks } from './resources/Tasks/getTasks';

export class Timix implements INodeType {
	methods = {
		loadOptions: {
			async getEmployees(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('timixHrApi');
				const searchValue =
					typeof (this as any).getCurrentNodeParameter === 'function'
						? ((this as any).getCurrentNodeParameter() as string | undefined)
						: undefined;
				const search = typeof searchValue === 'string' ? searchValue.trim() : '';

				const requestOptions: IRequestOptions = {
					method: 'GET',
					baseURL: credentials.baseUrl as string,
					url: '/api/v2/employees/action-model',
					qs: {
						search,
						offset: 0,
						limit: 20,
						isBlocked: false,
						type: 'employee',
						sortAs: 'ASC',
						sortBy: 'id',
						excel: false,
						excludeMe: true,
					},
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'timixHrApi',
					requestOptions,
				);

				const payload = Array.isArray(response?.payload)
					? response.payload
					: Array.isArray(response?.data)
						? response.data
						: Array.isArray(response)
							? response
							: [];

				return payload
					.filter((item: any) => item && typeof item === 'object')
					.map((item: any) => {
						const nameParts = [item.name, item.surname]
							.filter((part: unknown) => typeof part === 'string' && part.trim())
							.join(' ');
						const label = nameParts.length > 0 ? nameParts : item.uuid ?? 'Employee';
						return {
							name: label,
							value: item.uuid ?? item.id ?? label,
						};
					});
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Timix',
		name: 'timix',
		icon: {
			light: 'file:../../../../../../../../n8n-nodes-timix/icons/timix.svg',
			dark: 'file:../../../../../../../../n8n-nodes-timix/icons/timix.dark.svg',
		},
		group: ['input'],
		version: 1,
		description: 'Timix HR actions',
		defaults: {
			name: 'Timix',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		credentials: [
			{
				name: 'timixHrApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Files',
						value: 'files',
					},
					{
						name: 'Tasks',
						value: 'tasks',
					},
				],
				default: 'files',
			},
			...fileOperations,
			...fileFields,
			...taskOperations,
			...taskFields,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'files' && operation === 'uploadFile') {
					const uploadResults = await uploadFile.call(this, itemIndex);
					results.push(...uploadResults);
					continue;
				}


				if (resource === 'tasks' && operation === 'createTask') {
					const createResults = await createTask.call(this, itemIndex);
					results.push(...createResults);
					continue;
				}

				if (resource === 'tasks' && operation === 'getTasks') {
					const getResults = await getTasks.call(this, itemIndex);
					results.push(...getResults);
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`Unsupported operation: ${resource} > ${operation}`,
					{ itemIndex },
				);
			} catch (error) {
				if (this.continueOnFail()) {
					results.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: { item: itemIndex },
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return [results];
	}
}
