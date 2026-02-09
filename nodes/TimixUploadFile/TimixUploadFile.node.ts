import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const folderOptions = [
	'skills',
	'shifts',
	'currencies',
	'companies',
	'departments',
	'jobs',
	'groups',
	'groupsandemployees',
	'employees',
	'divisions',
	'asset_trees',
	'accesses',
	'notes',
	'dayoffs',
	'education_levels',
	'vacancies',
	'transfers',
	'skill_tests',
	'trainings',
	'tasks',
	'task_assignments',
	'task_topics',
	'task_comments',
	'assignment_files',
	'documents',
	'document_types',
	'document_files',
	'assets',
	'asset_tree_properties',
	'responsibilities',
	'responsibles',
	'responsibility_reviews',
	'modified_files',
	'skill_test_scores',
	'offers',
	'asset_fiches',
	'asset_fich_items',
	'educations',
	'employee_relatives',
	'candidates',
];

export class TimixUploadFile implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Timix Upload File',
		name: 'timixUploadFile',
		icon: { light: 'file:../../icons/timix.svg', dark: 'file:../../icons/timix.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Upload files to Timix HR',
		defaults: {
			name: 'Upload File',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'timixHrApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Folder',
				name: 'folder',
				type: 'options',
				options: folderOptions.map((value) => ({
					name: value,
					value,
				})),
				default: 'tasks',
				required: true,
				description: 'Target folder for uploaded files',
			},
			{
				displayName: 'Binary Properties',
				name: 'binaryProperties',
				type: 'string',
				default: 'data',
				placeholder: 'data, file1, file2',
				description:
					'Comma-separated binary property names to upload. Each property should contain binary data.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const folder = this.getNodeParameter('folder', itemIndex) as string;
				const binaryPropertiesRaw = this.getNodeParameter(
					'binaryProperties',
					itemIndex,
					'data',
				) as string;

				const binaryProperties = binaryPropertiesRaw
					.split(',')
					.map((value) => value.trim())
					.filter((value) => value.length > 0);

				if (binaryProperties.length === 0) {
					throw new NodeOperationError(this.getNode(), 'No binary properties provided', {
						itemIndex,
					});
				}

				if (binaryProperties.length > 10) {
					throw new NodeOperationError(this.getNode(), 'Maximum 10 files allowed per request', {
						itemIndex,
					});
				}

				const formFiles = [];
				for (const propertyName of binaryProperties) {
					const binaryData = items[itemIndex].binary?.[propertyName];
					if (!binaryData) {
						throw new NodeOperationError(
							this.getNode(),
							`Binary property "${propertyName}" is missing`,
							{ itemIndex },
						);
					}

					const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
					formFiles.push({
						value: buffer,
						options: {
							filename: binaryData.fileName ?? propertyName,
							contentType: binaryData.mimeType,
						},
					});
				}

				const credentials = await this.getCredentials('timixHrApi');
				// n8n's runtime supports `formData`, but the local types may not include it.
				// Cast to avoid TS error while keeping correct runtime behavior.
				const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						baseURL: credentials.baseUrl as string,
						url: '/api/v2/file',
						formData: {
							folder,
							files: formFiles,
						},
						json: true,
					} as IHttpRequestOptions;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'timixHrApi',
					requestOptions,
				);

				if (Array.isArray(response)) {
					for (const file of response) {
						results.push({ json: file, pairedItem: { item: itemIndex } });
					}
				} else {
					results.push({ json: response, pairedItem: { item: itemIndex } });
				}
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
