import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { chatFields, chatOperations } from './resources/Chat/description';
import { resolveTarget } from './resources/Chat/resolveTarget';
import { searchTargets } from './resources/Chat/searchTargets';
import { sendMessage } from './resources/Chat/sendMessage';
import { fileFields, fileOperations } from './resources/Files/description';
import { uploadFile } from './resources/Files/uploadFile';
import { taskFields, taskOperations } from './resources/Tasks/description';
import { createTask } from './resources/Tasks/createTask';

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
				displayName: 'Dynamic Credential',
				name: 'accessTokenOverride',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				placeholder: '={{$json.accessToken}}',
				description:
					'Optional. Provide a token manually or via expression to override the credential token for this request.',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
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
			...chatOperations,
			...chatFields,
			...fileOperations,
			...fileFields,
			...taskOperations,
			...taskFields,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// n8n executes this node per input item; we aggregate results in order.
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// These parameters are defined by the "Resource" and "Operation" selectors in the UI.
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'files' && operation === 'uploadFile') {
					const uploadResults = await uploadFile.call(this, itemIndex);
					results.push(...uploadResults);
					continue;
				}

				if (resource === 'chat' && operation === 'searchTargets') {
					const searchResults = await searchTargets.call(this, itemIndex);
					results.push(...searchResults);
					continue;
				}

				if (resource === 'chat' && operation === 'resolveTarget') {
					const resolveResults = await resolveTarget.call(this, itemIndex);
					results.push(...resolveResults);
					continue;
				}

				if (resource === 'chat' && operation === 'sendMessage') {
					const sendResults = await sendMessage.call(this, itemIndex);
					results.push(...sendResults);
					continue;
				}

				if (resource === 'tasks' && operation === 'createTask') {
					const createResults = await createTask.call(this, itemIndex);
					results.push(...createResults);
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`Unsupported operation: ${resource} > ${operation}`,
					{ itemIndex },
				);
			} catch (error) {
				if (this.continueOnFail()) {
					// Preserve the original item payload when continuing, to avoid data loss.
					results.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: { item: itemIndex },
					});
				} else {
					// Keep itemIndex in error context so n8n can display the failing row.
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
