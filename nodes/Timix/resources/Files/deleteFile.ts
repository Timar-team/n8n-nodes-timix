import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export async function deleteFile(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	throw new NodeOperationError(
		this.getNode(),
		'Files > Delete File is not implemented yet',
		{ itemIndex },
	);
}
