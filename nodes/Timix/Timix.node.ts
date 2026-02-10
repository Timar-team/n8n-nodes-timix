import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { fileFields, fileOperations } from './resources/Files/description';
import { uploadFile } from './resources/Files/uploadFile';
import { deleteFile } from './resources/Files/deleteFile';
import { taskFields, taskOperations } from './resources/Tasks/description';
import { createTask } from './resources/Tasks/createTask';
import { getTasks } from './resources/Tasks/getTasks';

export class Timix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Timix',
		name: 'timix',
		icon: {
			light: 'file:timix.svg',
			dark: 'file:timix.dark.svg',
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

				if (resource === 'files' && operation === 'deleteFile') {
					const deleteResults = await deleteFile.call(this, itemIndex);
					results.push(...deleteResults);
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
