import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { timixApiRequest } from '../shared';

// Backend limit: max 10 files per multipart request.
export const MAX_FILES_PER_UPLOAD = 10;

type MultipartFile = {
	value: unknown;
	options: {
		filename: string;
		contentType: string | undefined;
	};
};

/**
 * Upload the given binary properties of one input item to the Files service
 * in a single multipart request and return the raw response.
 *
 * Callers validate the number of properties; this only checks that each one exists.
 * The multipart Content-Type (with boundary) is left to the HTTP client.
 */
export async function uploadBinaryProperties(
	context: IExecuteFunctions,
	itemIndex: number,
	folder: string,
	binaryProperties: string[],
): Promise<unknown> {
	const item = context.getInputData()[itemIndex];

	const formFiles: MultipartFile[] = [];
	for (const propertyName of binaryProperties) {
		const binaryData = item.binary?.[propertyName];
		if (!binaryData) {
			throw new NodeOperationError(
				context.getNode(),
				`Binary property "${propertyName}" is missing`,
				{
					itemIndex,
				},
			);
		}

		const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, propertyName);
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
			files: MultipartFile[];
		};
	};

	return await timixApiRequest(context, itemIndex, requestOptions, 'files');
}
