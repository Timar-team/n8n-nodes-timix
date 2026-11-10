import type { INodeProperties } from 'n8n-workflow';

const offerDisplay = {
	show: {
		resource: ['offers'],
	},
};

const operationDisplay = (...operations: string[]) => ({
	show: {
		resource: ['offers'],
		operation: operations,
	},
});

const attachmentsField: INodeProperties = {
	displayName: 'Attachments',
	name: 'attachments',
	type: 'string',
	default: '',
	placeholder: 'data, data_1',
	description:
		'Comma-separated names of binary properties on the input item to attach. They are uploaded to the offers folder in one request first (max 10 files, 200 MB each).',
};

export const offerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: offerDisplay,
		options: [
			{
				name: 'Create Complaint',
				value: 'createComplaint',
				action: 'Create a complaint',
				description:
					'Create a complaint with a proposed solution. Not idempotent: every run creates a new record and notifies reviewers, so it is never retried automatically.',
			},
			{
				name: 'Create Offer',
				value: 'createOffer',
				action: 'Create an offer',
				description:
					'Create an offer (suggestion). Not idempotent: every run creates a new record and notifies reviewers, so it is never retried automatically.',
			},
		],
		default: 'createOffer',
	},
];

export const offerFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: operationDisplay('createOffer', 'createComplaint'),
		default: '',
		required: true,
		description: 'Short title of the offer or complaint',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		displayOptions: operationDisplay('createOffer', 'createComplaint'),
		default: '',
		required: true,
		description: 'Full text of the offer or complaint',
	},
	{
		displayName: 'Solution',
		name: 'solution',
		type: 'string',
		typeOptions: { rows: 4 },
		displayOptions: operationDisplay('createComplaint'),
		default: '',
		required: true,
		description: 'Proposed solution for the complaint',
	},
	{
		displayName: 'Anonymous',
		name: 'anonymity',
		type: 'boolean',
		displayOptions: operationDisplay('createOffer', 'createComplaint'),
		default: true,
		description:
			'Whether to create the record without an author. When off, it is created in the name of the access token owner from the credential (or from Dynamic Credential, if set).',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: operationDisplay('createOffer'),
		default: {},
		options: [
			attachmentsField,
			{
				displayName: 'Solution',
				name: 'solution',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Optional proposed solution for the offer',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: operationDisplay('createComplaint'),
		default: {},
		options: [attachmentsField],
	},
	{
		displayName: 'Include Metadata',
		name: 'includeMetadata',
		type: 'boolean',
		displayOptions: offerDisplay,
		default: false,
		description: 'Whether to return the full HR response envelope instead of only payload data',
	},
];
