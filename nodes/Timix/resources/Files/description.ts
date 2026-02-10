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
				resource: ['files'],
			},
		},
		options: [
			{
				name: 'Upload File',
				value: 'uploadFile',
				description: 'Upload a file',
			},
			{
				name: 'Delete File',
				value: 'deleteFile',
				description: 'Delete a file',
			},
		],
		default: 'uploadFile',
	},
];

export const fileFields: INodeProperties[] = [
	{
		displayName: 'Folder',
		name: 'folder',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['files'],
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
				resource: ['files'],
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
