import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TimixHrApi implements ICredentialType {
	name = 'timixHrApi';

	displayName = 'Timix HR API';

	icon: Icon = {
		light: 'file:../nodes/Timix/timix.svg',
		dark: 'file:../nodes/Timix/timix.dark.svg',
	};

	documentationUrl = 'https://github.com/Timar-team/n8n-nodes-timix';

	properties: INodeProperties[] = [
		// Keep the original key so existing credentials continue to work.
		{
			displayName: 'HR Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'http://localhost:3001',
			required: true,
			description: 'Base URL of the HR service or the shared Timix gateway',
		},
		{
			displayName: 'Files Base URL',
			name: 'filesBaseUrl',
			type: 'string',
			default: '',
			placeholder: 'http://localhost:3002',
			description:
				'Optional base URL of the Files service. Leave empty when HR and Files use the same gateway.',
		},
		// Access token provided by Timix HR; stored as a password in n8n.
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	// Injects the bearer token on every request.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.accessToken}}',
			},
		},
	};

	// Simple health endpoint to validate credentials in the UI.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/api/v2/health',
			method: 'GET',
		},
	};
}
