import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { timixApiRequest } from '../shared';

export async function uploadFile(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	// We rely on binary data attached to the incoming item.
	const items = this.getInputData();
	const folder = this.getNodeParameter('folder', itemIndex) as string;
	const binaryPropertiesList = this.getNodeParameter(
		'binaryPropertiesList',
		itemIndex,
		{},
	) as { properties?: Array<{ property?: string }> };

	// Normalize user-provided binary property names.
	const binaryPropertiesFromList =
		binaryPropertiesList.properties
			?.map((entry) => (entry.property ?? '').trim())
			.filter((value) => value.length > 0) ?? [];

	// If no explicit properties are provided, upload all binary fields on the item.
	const binaryProperties =
		binaryPropertiesFromList.length > 0
			? Array.from(new Set(binaryPropertiesFromList))
			: Object.keys(items[itemIndex].binary ?? {});

	if (binaryProperties.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No binary properties found', {
			itemIndex,
		});
	}

	// Backend limit: max 10 files per request.
	if (binaryProperties.length > 10) {
		throw new NodeOperationError(this.getNode(), 'Maximum 10 files allowed per request', {
			itemIndex,
		});
	}

	// Build multipart form data with the binary buffers.
	const formFiles = [];
	for (const propertyName of binaryProperties) {
		const binaryData = items[itemIndex].binary?.[propertyName];
		if (!binaryData) {
			throw new NodeOperationError(
				this.getNode(),
				`Binary property "${propertyName}" is missing`,
				{ itemIndex },
			);
		}

		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
		formFiles.push({
			value: buffer,
			options: {
				filename: binaryData.fileName ?? propertyName,
				contentType: binaryData.mimeType,
			},
		});
	}

	const requestOptions = {
		method: 'POST',
		url: '/api/v2/file',
		formData: {
			folder,
			files: formFiles,
		},
	} as IHttpRequestOptions & {
		formData: {
			folder: string;
			files: Array<{
				value: unknown;
				options: {
					filename: string;
					contentType: string | undefined;
				};
			}>;
		};
	};
	const response: unknown = await timixApiRequest(this, itemIndex, requestOptions);

	// Response shapes vary; extract UUIDs defensively for convenience.
	const extractUuids = (input: unknown): string[] => {
		const uuids: string[] = [];
		const pushUuid = (value: unknown) => {
			if (typeof value !== 'string') return;
			const trimmed = value.trim();
			if (trimmed.length === 0) return;
			const looksJson =
				(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
				(trimmed.startsWith('[') && trimmed.endsWith(']'));
			if (looksJson) {
				try {
					const parsed = JSON.parse(trimmed);
					collect(parsed);
					return;
				} catch {
					// fall through to push raw string
				}
			}
			uuids.push(trimmed);
		};

		const collectFromObject = (obj: Record<string, unknown>) => {
			pushUuid(obj.uuid);
			pushUuid(obj.fileUuid);
			pushUuid(obj.id);
			if (obj.file && typeof obj.file === 'object') {
				collectFromObject(obj.file as Record<string, unknown>);
			}
		};

		const collect = (value: unknown) => {
			if (Array.isArray(value)) {
				for (const item of value) {
					if (typeof item === 'string') {
						pushUuid(item);
					} else if (item && typeof item === 'object') {
						collectFromObject(item as Record<string, unknown>);
					}
				}
				return;
			}
			if (typeof value === 'string') {
				pushUuid(value);
				return;
			}
			if (value && typeof value === 'object') {
				const obj = value as Record<string, unknown>;
				if (Array.isArray(obj.data)) {
					for (const item of obj.data) {
						if (item && typeof item === 'object') {
							collectFromObject(item as Record<string, unknown>);
						} else {
							pushUuid(item);
						}
					}
				} else if (Array.isArray(obj.files)) {
					for (const item of obj.files) {
						if (item && typeof item === 'object') {
							collectFromObject(item as Record<string, unknown>);
						} else {
							pushUuid(item);
						}
					}
				} else if (Array.isArray(obj.items)) {
					for (const item of obj.items) {
						if (item && typeof item === 'object') {
							collectFromObject(item as Record<string, unknown>);
						} else {
							pushUuid(item);
						}
					}
				} else {
					collectFromObject(obj);
				}
			}
		};

		if (Array.isArray(input)) {
			collect(input);
		} else if (typeof input === 'string') {
			collect(input);
		} else if (input && typeof input === 'object') {
			const obj = input as Record<string, unknown>;
			collect(obj);
		}

		return Array.from(new Set(uuids));
	};

	const uuids = extractUuids(response);
	if (uuids.length > 0) {
		// Normalize to a predictable output when UUIDs are present.
		return [
			{
				json: { uuids },
				pairedItem: { item: itemIndex },
			},
		];
	}

	return [{ json: response as IDataObject, pairedItem: { item: itemIndex } }];
}
