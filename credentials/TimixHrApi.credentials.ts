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
		light: 'file:../../../../../../../../n8n-nodes-timix/icons/timix.svg',
		dark: 'file:../../../../../../../../n8n-nodes-timix/icons/timix.dark.svg',
	};

	documentationUrl = '';

	properties: INodeProperties[] = [
		// Base URL for the tenant, without trailing slash.
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://company.timix.org',
			required: true,
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
