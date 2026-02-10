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
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
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
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description: 'Optional list of topic UUIDs (comma-separated or JSON)',
	},
	{
		displayName: 'New Topics',
		name: 'newTopics',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'Topic A, Topic B',
		description: 'Optional list of new topic names (comma-separated or JSON)',
	},
	{
		displayName: 'Group UUIDs',
		name: 'groupUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description:
			'Optional group UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Employee UUIDs',
		name: 'employeeUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description:
			'Optional employee UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Company UUIDs',
		name: 'companyUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description:
			'Optional company UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Division UUIDs',
		name: 'divisionUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description:
			'Optional division UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Department UUIDs',
		name: 'departmentUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description:
			'Optional department UUIDs. At least one of Group, Employee, Company, Division, Department must be provided.',
	},
	{
		displayName: 'Job UUIDs',
		name: 'jobUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description: 'Optional job UUIDs',
	},
	{
		displayName: 'File UUIDs',
		name: 'fileUuids',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['tasks'],
				operation: ['createTask'],
			},
		},
		default: '',
		placeholder: 'uuid-1, uuid-2',
		description: 'Optional file UUIDs',
	},
];
