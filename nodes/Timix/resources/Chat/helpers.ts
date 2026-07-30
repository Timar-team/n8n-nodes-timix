import type { IDataObject, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	extractCollectionValues,
	normalizeOptionalString,
	normalizeUuidList,
} from '../shared';

export const getUuidListParameter = (
	getNodeParameter: (name: string, defaultValue?: unknown) => unknown,
	name: string,
): string[] =>
	normalizeUuidList(extractCollectionValues(getNodeParameter(name, {}), 'uuid'));

export const buildSendMessagePayload = ({
	messageType,
	content,
	fileUuids,
	replyToMessageUuid,
	threadRootMessageUuid,
	scheduledAt,
	expiresAt,
	outBoxPattern,
	mentionAll,
	mentionEmployeeUuids,
	mentionDivisionUuids,
	mentionDepartmentUuids,
	mentionGroupUuids,
	mentionJobUuids,
}: {
	messageType: string;
	content: string;
	fileUuids: string[];
	replyToMessageUuid?: unknown;
	threadRootMessageUuid?: unknown;
	scheduledAt?: unknown;
	expiresAt?: unknown;
	outBoxPattern?: unknown;
	mentionAll: boolean;
	mentionEmployeeUuids: string[];
	mentionDivisionUuids: string[];
	mentionDepartmentUuids: string[];
	mentionGroupUuids: string[];
	mentionJobUuids: string[];
}): IDataObject => {
	const trimmedContent = content.trim();
	const normalizedFileUuids = normalizeUuidList(fileUuids);

	if (trimmedContent.length === 0 && normalizedFileUuids.length === 0) {
		throw new Error('Provide message content or at least one file UUID');
	}

	if ((messageType === 'file' || messageType === 'audio') && normalizedFileUuids.length === 0) {
		throw new Error(`Message type "${messageType}" requires at least one file UUID`);
	}

	const payload: IDataObject = {
		type: messageType,
		mentionAll,
	};

	if (trimmedContent.length > 0) {
		payload.content = trimmedContent;
	}
	if (normalizedFileUuids.length > 0) {
		payload.fileUuids = normalizedFileUuids;
	}

	const optionalFields: Array<[string, unknown]> = [
		['replyToMessageUuid', replyToMessageUuid],
		['threadRootMessageUuid', threadRootMessageUuid],
		['scheduledAt', scheduledAt],
		['expiresAt', expiresAt],
		['outBoxPattern', outBoxPattern],
	];

	for (const [key, value] of optionalFields) {
		const normalized = normalizeOptionalString(value);
		if (normalized) {
			payload[key] = normalized;
		}
	}

	if (mentionEmployeeUuids.length > 0) {
		payload.mentionEmployeeUuids = mentionEmployeeUuids;
	}
	if (mentionDivisionUuids.length > 0) {
		payload.mentionDivisionUuids = mentionDivisionUuids;
	}
	if (mentionDepartmentUuids.length > 0) {
		payload.mentionDepartmentUuids = mentionDepartmentUuids;
	}
	if (mentionGroupUuids.length > 0) {
		payload.mentionGroupUuids = mentionGroupUuids;
	}
	if (mentionJobUuids.length > 0) {
		payload.mentionJobUuids = mentionJobUuids;
	}

	return payload;
};

export const buildPollOptions = (optionsInput: unknown): Array<{ text: string }> => {
	if (!optionsInput || typeof optionsInput !== 'object') return [];
	const entries = (optionsInput as { values?: Array<{ text?: unknown }> }).values;
	if (!Array.isArray(entries)) return [];

	return entries
		.map((entry) => {
			if (!entry || typeof entry !== 'object') return undefined;
			const text = normalizeOptionalString(entry.text);
			if (!text) return undefined;
			return { text };
		})
		.filter((entry): entry is { text: string } => entry !== undefined);
};

export const buildCreatePollPayload = ({
	question,
	options,
	isMultipleChoice,
	isAnonymous,
	resultsVisibility,
	allowVoteChange,
	expiresAt,
	replyToMessageUuid,
	threadRootMessageUuid,
	outBoxPattern,
}: {
	question: string;
	options: Array<{ text: string }>;
	isMultipleChoice: boolean;
	isAnonymous: boolean;
	resultsVisibility: string;
	allowVoteChange: boolean;
	expiresAt?: unknown;
	replyToMessageUuid?: unknown;
	threadRootMessageUuid?: unknown;
	outBoxPattern?: unknown;
}): IDataObject => {
	const trimmedQuestion = question.trim();
	if (trimmedQuestion.length === 0) {
		throw new Error('Question is required');
	}
	if (trimmedQuestion.length > 255) {
		throw new Error('Question must be 255 characters or fewer');
	}
	if (options.length < 2) {
		throw new Error('At least two poll options are required');
	}

	const payload: IDataObject = {
		question: trimmedQuestion,
		options,
		isMultipleChoice,
		isAnonymous,
		resultsVisibility,
		allowVoteChange,
	};

	const optionalFields: Array<[string, unknown]> = [
		['expiresAt', expiresAt],
		['replyToMessageUuid', replyToMessageUuid],
		['threadRootMessageUuid', threadRootMessageUuid],
		['outBoxPattern', outBoxPattern],
	];

	for (const [key, value] of optionalFields) {
		const normalized = normalizeOptionalString(value);
		if (normalized) {
			payload[key] = normalized;
		}
	}

	return payload;
};

export const toNodeOperationError = (
	error: unknown,
	getNode: () => INode,
	itemIndex: number,
): NodeOperationError =>
	new NodeOperationError(
		getNode(),
		error instanceof Error ? error : String(error),
		{ itemIndex },
	);
