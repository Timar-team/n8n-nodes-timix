import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { buildCreatePollPayload, buildPollOptions, toNodeOperationError } from './helpers';
import { timixApiRequest } from '../shared';

export async function createPoll(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	try {
		const conversationUuid = this.getNodeParameter('conversationUuid', itemIndex) as string;
		const question = this.getNodeParameter('question', itemIndex) as string;
		const options = buildPollOptions(this.getNodeParameter('options', itemIndex, {}));
		const isMultipleChoice = this.getNodeParameter(
			'isMultipleChoice',
			itemIndex,
			false,
		) as boolean;
		const isAnonymous = this.getNodeParameter('isAnonymous', itemIndex, false) as boolean;
		const resultsVisibility = this.getNodeParameter(
			'resultsVisibility',
			itemIndex,
			'always',
		) as string;
		const allowVoteChange = this.getNodeParameter(
			'allowVoteChange',
			itemIndex,
			false,
		) as boolean;

		const payload = buildCreatePollPayload({
			question,
			options,
			isMultipleChoice,
			isAnonymous,
			resultsVisibility,
			allowVoteChange,
			expiresAt: this.getNodeParameter('expiresAt', itemIndex, ''),
			replyToMessageUuid: this.getNodeParameter('replyToMessageUuid', itemIndex, ''),
			threadRootMessageUuid: this.getNodeParameter('threadRootMessageUuid', itemIndex, ''),
			outBoxPattern: this.getNodeParameter('outBoxPattern', itemIndex, ''),
		});

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `/api/v2/chat/conversations/${conversationUuid}/polls`,
			body: payload,
			json: true,
		};

		const response = await timixApiRequest<IDataObject>(this, itemIndex, requestOptions);
		return [{ json: response, pairedItem: { item: itemIndex } }];
	} catch (error) {
		throw toNodeOperationError(error, () => this.getNode(), itemIndex);
	}
}
