import type { INodeProperties } from 'n8n-workflow';

const honorDisplay = {
	show: {
		resource: ['honors'],
	},
};

const operationDisplay = (...operations: string[]) => ({
	show: {
		resource: ['honors'],
		operation: operations,
	},
});

export const honorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: honorDisplay,
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an honor',
				description: 'Create a reusable honor or badge definition',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an honor',
				description: 'Delete an honor and all of its employee assignments',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an honor',
				description: 'Get an honor and its employee assignments',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many honors',
				description: 'List or search honor definitions',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an honor',
				description: 'Update an honor definition or its image',
			},
		],
		default: 'create',
	},
];

export const honorFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: operationDisplay('create'),
		default: '',
		required: true,
		description: 'Honor title, up to 250 characters',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		displayOptions: operationDisplay('create'),
		default: '',
		required: true,
		description: 'Honor description; Markdown is supported',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'number',
		typeOptions: { minValue: 0, numberStepSize: 1 },
		displayOptions: operationDisplay('create'),
		default: 0,
		description: 'Display priority of the honor',
	},
	{
		displayName: 'File UUID',
		name: 'fileUuid',
		type: 'string',
		displayOptions: operationDisplay('create'),
		default: '',
		placeholder: 'UUID returned by File > Upload with folder honors',
		description: 'Optional UUID of an image uploaded to the honors folder',
	},
	{
		displayName: 'Honor UUID',
		name: 'honorUuid',
		type: 'string',
		displayOptions: operationDisplay('get', 'update', 'delete'),
		default: '',
		required: true,
		description: 'Public UUID of the honor definition',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: operationDisplay('update'),
		default: {},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'New honor description; Markdown is supported',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'number',
				typeOptions: { minValue: 0, numberStepSize: 1 },
				default: 0,
				description: 'New display priority',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'New honor title',
			},
		],
	},
	{
		displayName: 'Image Action',
		name: 'fileAction',
		type: 'options',
		displayOptions: operationDisplay('update'),
		options: [
			{ name: 'Keep Current Image', value: 'keep' },
			{ name: 'Set Image', value: 'set' },
			{ name: 'Remove Image', value: 'remove' },
		],
		default: 'keep',
		description: 'Whether to keep, replace, or detach the current honor image',
	},
	{
		displayName: 'New File UUID',
		name: 'newFileUuid',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['honors'],
				operation: ['update'],
				fileAction: ['set'],
			},
		},
		default: '',
		required: true,
		description: 'UUID of an image uploaded to the honors folder',
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: operationDisplay('getMany'),
		default: '',
		description: 'Case-insensitive search in title and description',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: operationDisplay('getMany'),
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				resource: ['honors'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: {
			show: {
				resource: ['honors'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		default: 0,
		description: 'Number of results to skip',
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		displayOptions: operationDisplay('getMany'),
		options: [
			{ name: 'Created At', value: 'createdAt' },
			{ name: 'Priority', value: 'priority' },
			{ name: 'Title', value: 'title' },
			{ name: 'Updated At', value: 'updatedAt' },
		],
		default: 'createdAt',
	},
	{
		displayName: 'Sort Direction',
		name: 'sortAs',
		type: 'options',
		displayOptions: operationDisplay('getMany'),
		options: [
			{ name: 'Ascending', value: 'ASC' },
			{ name: 'Descending', value: 'DESC' },
		],
		default: 'DESC',
	},
	{
		displayName: 'Include Metadata',
		name: 'includeMetadata',
		type: 'boolean',
		displayOptions: honorDisplay,
		default: false,
		description: 'Whether to return the full HR response envelope instead of only payload data',
	},
];
