import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export async function getTasks(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	throw new NodeOperationError(
		this.getNode(),
		'Tasks > Get Tasks is not implemented yet',
		{ itemIndex },
	);
}
