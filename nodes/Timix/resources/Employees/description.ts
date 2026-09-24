import type { INodeProperties } from 'n8n-workflow';

const employeeDisplay = {
	show: {
		resource: ['employees'],
	},
};

export const employeeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: employeeDisplay,
		options: [
			{
				name: 'Search for Honor Assignment',
				value: 'searchForHonor',
				action: 'Search employees for an honor assignment',
				description: 'Find employee UUIDs within the current honor assignment access scope',
			},
		],
		default: 'searchForHonor',
	},
];

export const employeeFields: INodeProperties[] = [
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: employeeDisplay,
		default: '',
		required: true,
		description:
			'Search by name, username, email, or phone; use a specific term because the API returns at most 20 records',
	},
	{
		displayName: 'Exclude Me',
		name: 'excludeMe',
		type: 'boolean',
		displayOptions: employeeDisplay,
		default: false,
		description: 'Whether to exclude the employee who owns the access token',
	},
	{
		displayName: 'Employee Types',
		name: 'employeeTypes',
		type: 'fixedCollection',
		displayOptions: employeeDisplay,
		default: {},
		placeholder: 'Add Type',
		typeOptions: { multipleValues: true },
		description: 'Optional employee type filters sent as repeated type parameters',
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Include Metadata',
		name: 'includeMetadata',
		type: 'boolean',
		displayOptions: employeeDisplay,
		default: false,
		description: 'Whether to return the full HR response envelope instead of only payload data',
	},
];
