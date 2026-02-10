import type { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export async function uploadFile(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const items = this.getInputData();
	const folder = this.getNodeParameter('folder', itemIndex) as string;
	const binaryPropertiesList = this.getNodeParameter(
		'binaryPropertiesList',
		itemIndex,
		{},
	) as { properties?: Array<{ property?: string }> };

	const binaryPropertiesFromList =
		binaryPropertiesList.properties
			?.map((entry) => (entry.property ?? '').trim())
			.filter((value) => value.length > 0) ?? [];

	const binaryProperties =
		binaryPropertiesFromList.length > 0
			? Array.from(new Set(binaryPropertiesFromList))
			: Object.keys(items[itemIndex].binary ?? {});

	if (binaryProperties.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No binary properties found', {
			itemIndex,
		});
	}

	if (binaryProperties.length > 10) {
		throw new NodeOperationError(this.getNode(), 'Maximum 10 files allowed per request', {
			itemIndex,
		});
	}

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

	const credentials = await this.getCredentials('timixHrApi');
	// n8n's runtime supports `formData`, but the local types may not include it.
	// Cast to avoid TS error while keeping correct runtime behavior.
	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		baseURL: credentials.baseUrl as string,
		url: '/api/v2/file',
		formData: {
			folder,
			files: formFiles,
		},
	} as IHttpRequestOptions;

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'timixHrApi',
		requestOptions,
	);

	if (Array.isArray(response)) {
		return response.map((file) => ({
			json: file,
			pairedItem: { item: itemIndex },
		}));
	}

	return [{ json: response, pairedItem: { item: itemIndex } }];
}
