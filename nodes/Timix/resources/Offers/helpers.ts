import type { IDataObject } from 'n8n-workflow';
import { extractCollectionValues, normalizeOptionalString, normalizeUuidList } from '../shared';

export type OfferType = 'offer' | 'complaint';

// The `type` field is never shown in the UI; it is fixed by the selected operation.
export const OFFER_TYPE_BY_OPERATION: Record<string, OfferType> = {
	createOffer: 'offer',
	createComplaint: 'complaint',
};

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

/** Read the "File UUIDs" fixedCollection (`{ values: [{ uuid }] }`), same as Tasks > Create Task. */
export const getOfferFileUuids = (value: unknown): string[] =>
	normalizeUuidList(extractCollectionValues(value, 'uuid'));

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

const STATUS_HINTS: Record<number, string> = {
	400: 'The request failed validation. Check Title, Description, Anonymous, Solution (required for complaints) and File UUIDs.',
	401: 'The access token is missing, invalid or expired. Check the Timix credential or the Dynamic Credential value.',
	404: 'None of the given File UUIDs were found (modified_files not found). Upload the files with File > Upload and use the returned UUIDs.',
	419: 'The employee who owns the access token is blocked.',
	429: 'Rate limit reached. Wait before running again; this operation is never retried automatically because it is not idempotent.',
};

/** Build a user-facing message and hint for an HTTP error from the create request. */
export const describeOfferApiError = (
	type: OfferType,
	{ status, message }: ApiErrorDetails,
): { message: string; description?: string } => {
	const statusText = status !== undefined ? ` (HTTP ${status})` : '';
	const fullMessage = `Creating the ${type} failed${statusText}${message ? `: ${message}` : ''}`;

	let description: string | undefined = status !== undefined ? STATUS_HINTS[status] : undefined;
	if (status !== undefined && status >= 500) {
		description = `The ${type} may or may not have been created. Check before running again: a repeated request creates a duplicate and sends notifications again.`;
	}

	return description ? { message: fullMessage, description } : { message: fullMessage };
};
