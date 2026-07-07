import type { INodeProperties } from 'n8n-workflow';
import { folderOptions } from './constants';

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Upload',
				value: 'uploadFile',
				action: 'Upload a files',
				description: 'Upload a file',
			},
		],
		default: 'uploadFile',
	},
];

export const fileFields: INodeProperties[] = [
	// Folder list is sourced from Timix HR file buckets.
	{
		displayName: 'Folder',
		name: 'folder',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['uploadFile'],
			},
		},
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
		name: 'binaryPropertiesList',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['uploadFile'],
			},
		},
		default: {},
		placeholder: 'Add Property',
		typeOptions: {
			multipleValues: true,
		},
		description:
			'Add binary property names individually. If empty, all binary properties from the input item are uploaded.',
		options: [
			{
				name: 'properties',
				displayName: 'Properties',
				values: [
					{
						displayName: 'Property',
						name: 'property',
						type: 'string',
						default: '',
						placeholder: 'file1',
					},
				],
			},
		],
	},
];
