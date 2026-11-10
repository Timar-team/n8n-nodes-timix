import type { IDataObject } from 'n8n-workflow';
import { MAX_FILES_PER_UPLOAD } from '../Files/helpers';
import { normalizeListFromString, normalizeOptionalString, normalizeUuidList } from '../shared';

export type OfferType = 'offer' | 'complaint';

// The `type` field is never shown in the UI; it is fixed by the selected operation.
export const OFFER_TYPE_BY_OPERATION: Record<string, OfferType> = {
	createOffer: 'offer',
	createComplaint: 'complaint',
};

export const OFFER_UPLOAD_FOLDER = 'offers';

const normalizeText = (value: unknown): string | undefined =>
	normalizeOptionalString(typeof value === 'number' ? String(value) : value);

/**
 * The API rejects the string "true" with a 400, so always send a real JSON boolean.
 * Expressions may still resolve to "true"/"false" strings; those are converted here.
 */
export const normalizeAnonymity = (value: unknown): boolean => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') return true;
		if (normalized === 'false') return false;
	}
	throw new Error('Anonymous must be true or false');
};

export const buildCreateOfferPayload = ({
	type,
	title,
	description,
	anonymity,
	solution,
	fileUuids,
}: {
	type: OfferType;
	title: unknown;
	description: unknown;
	anonymity: unknown;
	solution?: unknown;
	fileUuids?: string[];
}): IDataObject => {
	if (type !== 'offer' && type !== 'complaint') {
		throw new Error(`Unsupported offer type: ${String(type)}`);
	}

	const normalizedTitle = normalizeText(title);
	if (!normalizedTitle) throw new Error('Title is required');

	const normalizedDescription = normalizeText(description);
	if (!normalizedDescription) throw new Error('Description is required');

	const normalizedSolution = normalizeText(solution);
	if (type === 'complaint' && !normalizedSolution) {
		throw new Error('Solution is required for complaints');
	}

	// Send only documented fields: the API writes unknown keys (status, isActive, ...) to the record.
	const payload: IDataObject = {
		title: normalizedTitle,
		description: normalizedDescription,
		type,
		anonymity: normalizeAnonymity(anonymity),
	};
	if (normalizedSolution) payload.solution = normalizedSolution;

	const normalizedFileUuids = normalizeUuidList(fileUuids ?? []);
	if (normalizedFileUuids.length > 0) payload.fileUuids = normalizedFileUuids;

	return payload;
};

/** Parse the comma-separated "Attachments" field into unique binary property names. */
export const parseAttachmentPropertyNames = (value: unknown): string[] => {
	let names: string[];
	if (value === undefined || value === null) {
		names = [];
	} else if (typeof value === 'string') {
		names = normalizeListFromString(value);
	} else if (Array.isArray(value)) {
		names = value.flatMap((entry) =>
			typeof entry === 'string' ? normalizeListFromString(entry) : [],
		);
	} else {
		throw new Error('Attachments must be a comma-separated list of binary property names');
	}

	const unique = Array.from(new Set(names));
	if (unique.length > MAX_FILES_PER_UPLOAD) {
		throw new Error(
			`Too many attachments: ${unique.length} given, but at most ${MAX_FILES_PER_UPLOAD} files can be uploaded per request`,
		);
	}
	return unique;
};

/** The Files service answers with a bare array (no HR envelope); UUIDs live at `[i].uuid`. */
export const extractUploadedFileUuids = (response: unknown): string[] => {
	let value = response;
	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			throw new Error('Unexpected file upload response: expected a JSON array of files');
		}
	}
	if (!Array.isArray(value)) {
		throw new Error('Unexpected file upload response: expected an array of files');
	}

	const uuids: string[] = [];
	for (const entry of value) {
		if (entry && typeof entry === 'object') {
			const uuid = normalizeOptionalString((entry as Record<string, unknown>).uuid);
			if (uuid) uuids.push(uuid);
		}
	}
	return Array.from(new Set(uuids));
};

export type ApiErrorDetails = { status?: number; message?: string };

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

const toStatus = (value: unknown): number | undefined => {
	const status = typeof value === 'string' ? Number(value) : value;
	return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status < 600
		? status
		: undefined;
};

const messageFromBody = (body: unknown): string | undefined => {
	let value = body;
	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			return undefined;
		}
	}
	const message = asRecord(value)?.message;
	if (Array.isArray(message)) {
		const parts = message.filter((part): part is string => typeof part === 'string');
		return parts.length > 0 ? parts.join('; ') : undefined;
	}
	return normalizeOptionalString(message);
};

/**
 * Read the HTTP status and the API `message` from an n8n request error.
 * Error bodies are not wrapped in the HR envelope. n8n may nest the original
 * request error under `cause`, so a few known shapes are checked in order.
 */
export const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
	let status: number | undefined;
	let message: string | undefined;
	const queue: unknown[] = [error];
	const seen = new Set<unknown>();

	while (queue.length > 0 && (status === undefined || message === undefined)) {
		const current = asRecord(queue.shift());
		if (!current || seen.has(current)) continue;
		seen.add(current);

		const response = asRecord(current.response);
		status ??=
			toStatus(current.httpCode) ??
			toStatus(current.statusCode) ??
			toStatus(current.status) ??
			toStatus(response?.status) ??
			toStatus(response?.statusCode);
		message ??=
			messageFromBody(current.error) ??
			messageFromBody(response?.data) ??
			messageFromBody(response?.body) ??
			messageFromBody(asRecord(current.context)?.data);

		queue.push(current.cause, current.errorResponse, current.reason);
	}

	const details: ApiErrorDetails = {};
	if (status !== undefined) details.status = status;
	if (message !== undefined) details.message = message;
	return details;
};

export type OfferRequestStage = 'upload' | 'create';

const STATUS_HINTS: Record<number, string> = {
	400: 'The request failed validation. Check Title, Description, Anonymous and Solution (required for complaints).',
	401: 'The access token is missing, invalid or expired. Check the Timix credential or the Dynamic Credential value.',
	413: 'A file or the storage limit was exceeded. Each file can be at most 200 MB.',
	419: 'The employee who owns the access token is blocked.',
	429: 'Rate limit reached. Wait before running again; this operation is never retried automatically because it is not idempotent.',
};

/** Build a user-facing message and hint for an HTTP error from the upload or create request. */
export const describeOfferApiError = (
	stage: OfferRequestStage,
	type: OfferType,
	{ status, message }: ApiErrorDetails,
): { message: string; description?: string } => {
	const action = stage === 'upload' ? 'Attachment upload' : `Creating the ${type}`;
	const statusText = status !== undefined ? ` (HTTP ${status})` : '';
	const fullMessage = `${action} failed${statusText}${message ? `: ${message}` : ''}`;

	let description: string | undefined = status !== undefined ? STATUS_HINTS[status] : undefined;
	if (status === 404) {
		description =
			stage === 'create'
				? 'None of the attached file UUIDs were found (modified_files not found). Upload the attachments again.'
				: 'The upload endpoint was not found. Check the Files Base URL in the credential.';
	} else if (status !== undefined && status >= 500 && stage === 'create') {
		description = `The ${type} may or may not have been created. Check before running again: a repeated request creates a duplicate and sends notifications again.`;
	}

	return description ? { message: fullMessage, description } : { message: fullMessage };
};
