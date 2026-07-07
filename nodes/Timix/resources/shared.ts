import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export const normalizeListFromString = (value: string): string[] =>
	value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

export const collectUuids = (value: unknown, output: Set<string>) => {
	const pushUuid = (candidate: unknown) => {
		if (typeof candidate !== 'string') return;
		const trimmed = candidate.trim();
		if (trimmed.length === 0) return;
		const looksJson =
			(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
			(trimmed.startsWith('[') && trimmed.endsWith(']'));
		if (looksJson) {
			try {
				const parsed = JSON.parse(trimmed);
				collectUuids(parsed, output);
				return;
			} catch {
				// Fall through and treat as plain string.
			}
		}
		if (trimmed.includes(',')) {
			for (const entry of normalizeListFromString(trimmed)) {
				output.add(entry);
			}
			return;
		}
		output.add(trimmed);
	};

	const collectFromObject = (obj: Record<string, unknown>) => {
		pushUuid(obj.uuid);
		pushUuid(obj.id);
		pushUuid(obj.fileUuid);
		if (obj.file && typeof obj.file === 'object') {
			collectFromObject(obj.file as Record<string, unknown>);
		}
		if (Array.isArray(obj.data)) {
			for (const item of obj.data) {
				if (item && typeof item === 'object') {
					collectFromObject(item as Record<string, unknown>);
				} else {
					pushUuid(item);
				}
			}
		}
		if (Array.isArray(obj.files)) {
			for (const item of obj.files) {
				if (item && typeof item === 'object') {
					collectFromObject(item as Record<string, unknown>);
				} else {
					pushUuid(item);
				}
			}
		}
		if (Array.isArray(obj.items)) {
			for (const item of obj.items) {
				if (item && typeof item === 'object') {
					collectFromObject(item as Record<string, unknown>);
				} else {
					pushUuid(item);
				}
			}
		}
	};

	if (Array.isArray(value)) {
		for (const item of value) {
			if (item && typeof item === 'object') {
				collectFromObject(item as Record<string, unknown>);
			} else {
				pushUuid(item);
			}
		}
		return;
	}
	if (typeof value === 'string') {
		pushUuid(value);
		return;
	}
	if (value && typeof value === 'object') {
		collectFromObject(value as Record<string, unknown>);
	}
};

export const normalizeUuidList = (value: unknown): string[] => {
	const uuids = new Set<string>();
	collectUuids(value, uuids);
	return Array.from(uuids);
};

export const extractCollectionValues = (value: unknown, key: string): string[] => {
	if (!value || typeof value !== 'object') return [];
	const obj = value as Record<string, unknown>;
	const entries = obj.values;
	if (!Array.isArray(entries)) return [];
	const out: string[] = [];
	for (const entry of entries) {
		if (entry && typeof entry === 'object') {
			const record = entry as Record<string, unknown>;
			const val = record[key];
			if (typeof val === 'string' && val.trim().length > 0) {
				out.push(val.trim());
			}
		}
	}
	return out;
};

export const normalizeOptionalString = (value: unknown): string | undefined => {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

export async function timixApiRequest<T = unknown>(
	context: IExecuteFunctions,
	itemIndex: number,
	requestOptions: IHttpRequestOptions,
): Promise<T> {
	const credentials = await context.getCredentials('timixHrApi');
	const accessTokenOverride = context.getNodeParameter(
		'accessTokenOverride',
		itemIndex,
		'',
	) as string;
	const resolvedToken = accessTokenOverride?.toString().trim();

	requestOptions.baseURL = credentials.baseUrl as string;

	if (resolvedToken) {
		requestOptions.headers = {
			...(requestOptions.headers ?? {}),
			Authorization: `Bearer ${resolvedToken}`,
		};
		return (await context.helpers.request.call(context, requestOptions)) as T;
	}

	return (await context.helpers.requestWithAuthentication.call(
		context,
		'timixHrApi',
		requestOptions,
	)) as T;
}
