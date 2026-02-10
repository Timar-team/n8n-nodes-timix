import type { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['tasks'],
			},
		},
		options: [
			{
				name: 'Create Task',
				value: 'createTask',
				description: 'Create a task',
			},
			{
				name: 'Get Tasks',
				value: 'getTasks',
				description: 'Get tasks',
			},
		],
		default: 'createTask',
	},
];

export const taskFields: INodeProperties[] = [
	{
		displayName: 'Body Content Type',
		name: 'bodyContentType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		options: [
			{
				name: 'Form',
				value: 'form',
				description: 'Use form fields to build the request body',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Provide the raw JSON body',
			},
		],
		default: 'form',
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['json'],
			},
		},
		default: '',
		placeholder: '{ "title": "Task title", "priority": 2, "from": "...", "to": "..." }',
		description: 'Raw JSON body sent to the API',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: '',
		required: true,
		description: 'Task title',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Optional long text description',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		options: [
			{
				name: 'Low',
				value: 2,
			},
			{
				name: 'Medium',
				value: 3,
			},
			{
				name: 'High',
				value: 4,
			},
			{
				name: 'Very High',
				value: 5,
			},
		],
		default: 2,
		required: true,
		description: 'Task priority',
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: '',
		required: true,
		description: 'Start date/time',
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: '',
		required: true,
		description: 'End date/time',
	},
	{
		displayName: 'Single Submission',
		name: 'singleSubmission',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: false,
		description: 'Allow only a single submission per assignee',
	},
	{
		displayName: 'Topic UUIDs',
		name: 'topicUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description: 'Optional list of topic UUIDs',
	},
	{
		displayName: 'New Topics',
		name: 'newTopics',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add Topic',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [
					{
						displayName: 'Topic',
						name: 'topic',
						type: 'string',
						default: '',
					},
				],
			},
		],
		description: 'Optional list of new topic names',
	},
	{
		displayName: 'Group UUIDs',
		name: 'groupUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description:
			'Optional group UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Employee UUIDs',
		name: 'employeeUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description:
			'Optional employee UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Company UUIDs',
		name: 'companyUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description:
			'Optional company UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Division UUIDs',
		name: 'divisionUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description:
			'Optional division UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Department UUIDs',
		name: 'departmentUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description:
			'Optional department UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Job UUIDs',
		name: 'jobUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description: 'Optional job UUIDs',
	},
	{
		displayName: 'File UUIDs',
		name: 'fileUuids',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
				bodyContentType: ['form'],
			},
		},
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
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
		description: 'Optional file UUIDs',
	},
];
