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

export const taskFields: INodeProperties[] = [];
