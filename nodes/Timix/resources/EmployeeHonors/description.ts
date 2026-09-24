import type { INodeProperties } from 'n8n-workflow';

const employeeHonorDisplay = {
	show: {
		resource: ['employeeHonors'],
	},
};

const operationDisplay = (...operations: string[]) => ({
	show: {
		resource: ['employeeHonors'],
		operation: operations,
	},
});

const uuidCollection = (
	displayName: string,
	name: string,
	description: string,
	operations: string[],
): INodeProperties => ({
	displayName,
	name,
	type: 'fixedCollection',
	displayOptions: operationDisplay(...operations),
	default: {},
	placeholder: 'Add UUID',
	typeOptions: { multipleValues: true },
	description,
	options: [
		{
			name: 'values',
			displayName: 'Values',
			values: [
				{
					displayName: 'UUID',
					name: 'uuid',
					type: 'string',
					default: '',
				},
			],
		},
	],
});

export const employeeHonorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: employeeHonorDisplay,
		options: [
			{
				name: 'Assign',
				value: 'assign',
				action: 'Assign an honor to employees',
				description: 'Assign one honor definition to one or more employees',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an employee honor assignment',
				description: 'Get one assignment by its own UUID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many employee honor assignments',
				description: 'List or search employee honor assignments',
			},
			{
				name: 'Remove',
				value: 'remove',
				action: 'Remove an employee honor assignment',
				description: 'Remove one employee-to-honor connection without deleting the honor',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an employee honor assignment',
				description: 'Change assignment activity or expiration fields',
			},
		],
		default: 'assign',
	},
];

export const employeeHonorFields: INodeProperties[] = [
	{
		displayName: 'Honor UUID',
		name: 'honorUuid',
		type: 'string',
		displayOptions: operationDisplay('assign'),
		default: '',
		required: true,
		description: 'UUID of the honor definition to assign',
	},
	uuidCollection(
		'Employee UUIDs',
		'employeeUuids',
		'Employee UUIDs from Employee > Search for Honor Assignment; numeric IDs are not accepted',
		['assign'],
	),
	{
		displayName: 'Expires At',
		name: 'expiresAt',
		type: 'dateTime',
		displayOptions: operationDisplay('assign'),
		default: '',
		description: 'Optional ISO-8601 expiration time; leave empty for no date-based expiration',
	},
	{
		displayName: 'Expiry Text',
		name: 'expiryText',
		type: 'string',
		displayOptions: operationDisplay('assign'),
		default: '',
		description: 'Optional human-readable validity rule; it does not affect active status',
	},
	{
		displayName: 'Active',
		name: 'isActive',
		type: 'boolean',
		displayOptions: operationDisplay('assign'),
		default: true,
		description: 'Whether the assignment is manually active',
	},
	{
		displayName: 'Assignment UUID',
		name: 'assignmentUuid',
		type: 'string',
		displayOptions: operationDisplay('get', 'update', 'remove'),
		default: '',
		required: true,
		description: 'UUID of the assignment itself, not the honor or employee UUID',
	},
	{
		displayName: 'Expiration Date Action',
		name: 'expiresAtAction',
		type: 'options',
		displayOptions: operationDisplay('update'),
		options: [
			{ name: 'Keep Current Date', value: 'keep' },
			{ name: 'Set Date', value: 'set' },
			{ name: 'Clear Date', value: 'clear' },
		],
		default: 'keep',
		description: 'Whether to keep, set, or clear expiresAt',
	},
	{
		displayName: 'New Expires At',
		name: 'newExpiresAt',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['employeeHonors'],
				operation: ['update'],
				expiresAtAction: ['set'],
			},
		},
		default: '',
		required: true,
		description: 'New ISO-8601 expiration time',
	},
	{
		displayName: 'Expiry Text Action',
		name: 'expiryTextAction',
		type: 'options',
		displayOptions: operationDisplay('update'),
		options: [
			{ name: 'Keep Current Text', value: 'keep' },
			{ name: 'Set Text', value: 'set' },
			{ name: 'Clear Text', value: 'clear' },
		],
		default: 'keep',
		description: 'Whether to keep, set, or clear expiryText',
	},
	{
		displayName: 'New Expiry Text',
		name: 'newExpiryText',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['employeeHonors'],
				operation: ['update'],
				expiryTextAction: ['set'],
			},
		},
		default: '',
		required: true,
		description: 'New human-readable validity rule',
	},
	{
		displayName: 'Active Status Action',
		name: 'isActiveAction',
		type: 'options',
		displayOptions: operationDisplay('update'),
		options: [
			{ name: 'Keep Current Status', value: 'keep' },
			{ name: 'Activate', value: 'activate' },
			{ name: 'Deactivate', value: 'deactivate' },
		],
		default: 'keep',
		description: 'Whether to keep or change the manually active status',
	},
	uuidCollection(
		'Employee UUID Filters',
		'employeeUuidFilters',
		'Only return assignments for these employees',
		['getMany'],
	),
	uuidCollection(
		'Honor UUID Filters',
		'honorUuidFilters',
		'Only return assignments for these honors',
		['getMany'],
	),
	{
		displayName: 'Active Filter',
		name: 'activeFilter',
		type: 'options',
		displayOptions: operationDisplay('getMany'),
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Active', value: 'true' },
			{ name: 'Inactive or Expired', value: 'false' },
		],
		default: 'any',
		description: 'Filter by effective active status, including expiration',
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: operationDisplay('getMany'),
		default: '',
		description: 'Search honor and employee fields or expiry text',
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
				resource: ['employeeHonors'],
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
				resource: ['employeeHonors'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		default: 0,
		description: 'Number of assignments to skip',
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		displayOptions: operationDisplay('getMany'),
		options: [
			{ name: 'Created At', value: 'createdAt' },
			{ name: 'Expires At', value: 'expiresAt' },
			{ name: 'Is Active', value: 'isActive' },
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
		displayOptions: employeeHonorDisplay,
		default: false,
		description: 'Whether to return the full HR response envelope instead of only payload data',
	},
];
