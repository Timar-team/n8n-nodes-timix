import type { INodeProperties } from 'n8n-workflow';

const chatResourceDisplay = {
	show: {
		resource: ['chat'],
	},
};

const sendMessageDisplay = {
	show: {
		resource: ['chat'],
		operation: ['sendMessage'],
	},
};

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: chatResourceDisplay,
		options: [
			{
				name: 'Resolve Target',
				value: 'resolveTarget',
				action: 'Resolve a chat target to a conversation',
				description: 'Resolve a chat target to a conversation',
			},
			{
				name: 'Search Targets',
				value: 'searchTargets',
				action: 'Search available chat targets',
				description: 'Search available chat targets',
			},
			{
				name: 'Send Message',
				value: 'sendMessage',
				action: 'Send a message to a conversation',
				description: 'Send a message to a conversation',
			},
		],
		default: 'searchTargets',
	},
];

export const chatFields: INodeProperties[] = [
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['searchTargets'],
			},
		},
		default: '',
		required: true,
		description: 'Search term used by target search',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['searchTargets'],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['searchTargets'],
			},
		},
		typeOptions: {
			minValue: 0,
		},
		default: 0,
		description: 'Number of matching targets to skip',
	},
	{
		displayName: 'Target Type',
		name: 'targetType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['resolveTarget'],
			},
		},
		options: [
			{ name: 'Company', value: 'company' },
			{ name: 'Department', value: 'department' },
			{ name: 'Division', value: 'division' },
			{ name: 'Employee', value: 'employee' },
			{ name: 'Group', value: 'group' },
			{ name: 'Job', value: 'job' },
		],
		default: 'employee',
		required: true,
		description: 'Target type returned by Search Targets',
	},
	{
		displayName: 'Target UUID',
		name: 'targetUuid',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['resolveTarget'],
			},
		},
		default: '',
		required: true,
		description: 'Root-level target UUID from Search Targets',
	},
	{
		displayName: 'Conversation UUID',
		name: 'conversationUuid',
		type: 'string',
		displayOptions: sendMessageDisplay,
		default: '',
		required: true,
		description: 'Conversation UUID returned by Resolve Target',
	},
	{
		displayName: 'Message Type',
		name: 'messageType',
		type: 'options',
		displayOptions: sendMessageDisplay,
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'File', value: 'file' },
			{ name: 'Audio', value: 'audio' },
		],
		default: 'text',
		required: true,
		description: 'Message payload type',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		displayOptions: sendMessageDisplay,
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Text content of the message',
	},
	{
		displayName: 'File UUIDs',
		name: 'fileUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		description: 'Uploaded file UUIDs to attach to the message',
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
	},
	{
		displayName: 'Reply To Message UUID',
		name: 'replyToMessageUuid',
		type: 'string',
		displayOptions: sendMessageDisplay,
		default: '',
		description: 'Optional message UUID to reply to',
	},
	{
		displayName: 'Thread Root Message UUID',
		name: 'threadRootMessageUuid',
		type: 'string',
		displayOptions: sendMessageDisplay,
		default: '',
		description: 'Optional thread root message UUID for structure chats',
	},
	{
		displayName: 'Scheduled At',
		name: 'scheduledAt',
		type: 'dateTime',
		displayOptions: sendMessageDisplay,
		default: '',
		description: 'Schedule delivery at a specific date/time',
	},
	{
		displayName: 'Expires At',
		name: 'expiresAt',
		type: 'dateTime',
		displayOptions: sendMessageDisplay,
		default: '',
		description: 'Expire the message at a specific date/time',
	},
	{
		displayName: 'Mention All',
		name: 'mentionAll',
		type: 'boolean',
		displayOptions: sendMessageDisplay,
		default: false,
		description: 'Whether to mention all participants in the conversation',
	},
	{
		displayName: 'Out Box Pattern',
		name: 'outBoxPattern',
		type: 'string',
		displayOptions: sendMessageDisplay,
		default: '',
		description: 'Optional outbound pattern identifier',
	},
	{
		displayName: 'Mention Employee UUIDs',
		name: 'mentionEmployeeUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [{ displayName: 'UUID', name: 'uuid', type: 'string', default: '' }],
			},
		],
		description: 'Employee UUIDs to mention',
	},
	{
		displayName: 'Mention Division UUIDs',
		name: 'mentionDivisionUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [{ displayName: 'UUID', name: 'uuid', type: 'string', default: '' }],
			},
		],
		description: 'Division UUIDs to mention',
	},
	{
		displayName: 'Mention Department UUIDs',
		name: 'mentionDepartmentUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [{ displayName: 'UUID', name: 'uuid', type: 'string', default: '' }],
			},
		],
		description: 'Department UUIDs to mention',
	},
	{
		displayName: 'Mention Group UUIDs',
		name: 'mentionGroupUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [{ displayName: 'UUID', name: 'uuid', type: 'string', default: '' }],
			},
		],
		description: 'Group UUIDs to mention',
	},
	{
		displayName: 'Mention Job UUIDs',
		name: 'mentionJobUuids',
		type: 'fixedCollection',
		displayOptions: sendMessageDisplay,
		default: {},
		placeholder: 'Add UUID',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'values',
				displayName: 'Values',
				values: [{ displayName: 'UUID', name: 'uuid', type: 'string', default: '' }],
			},
		],
		description: 'Job UUIDs to mention',
	},
];
