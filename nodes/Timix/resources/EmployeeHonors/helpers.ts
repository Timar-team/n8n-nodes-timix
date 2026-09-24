import type { IDataObject } from 'n8n-workflow';
import { normalizeOptionalString, normalizeUuidList } from '../shared';

export const buildAssignHonorPayload = ({
	honorUuid,
	employeeUuids,
	expiresAt,
	expiryText,
	isActive,
}: {
	honorUuid: string;
	employeeUuids: string[];
	expiresAt?: unknown;
	expiryText?: unknown;
	isActive: boolean;
}): IDataObject => {
	const normalizedHonorUuid = normalizeOptionalString(honorUuid);
	if (!normalizedHonorUuid) throw new Error('Honor UUID is required');

	const normalizedEmployeeUuids = normalizeUuidList(employeeUuids);
	if (normalizedEmployeeUuids.length === 0) {
		throw new Error('At least one employee UUID is required');
	}

	const payload: IDataObject = {
		honorUuid: normalizedHonorUuid,
		employeeUuids: normalizedEmployeeUuids,
		isActive,
	};
	const normalizedExpiresAt = normalizeOptionalString(expiresAt);
	const normalizedExpiryText = normalizeOptionalString(expiryText);
	if (normalizedExpiresAt) payload.expiresAt = normalizedExpiresAt;
	if (normalizedExpiryText) payload.expiryText = normalizedExpiryText;

	return payload;
};

export const buildUpdateAssignmentPayload = ({
	expiresAtAction,
	expiresAt,
	expiryTextAction,
	expiryText,
	isActiveAction,
}: {
	expiresAtAction: string;
	expiresAt?: unknown;
	expiryTextAction: string;
	expiryText?: unknown;
	isActiveAction: string;
}): IDataObject => {
	const payload: IDataObject = {};

	if (expiresAtAction === 'set') {
		const normalizedExpiresAt = normalizeOptionalString(expiresAt);
		if (!normalizedExpiresAt) {
			throw new Error('Expires At is required when setting an expiration date');
		}
		payload.expiresAt = normalizedExpiresAt;
	} else if (expiresAtAction === 'clear') {
		payload.expiresAt = null;
	}

	if (expiryTextAction === 'set') {
		const normalizedExpiryText = normalizeOptionalString(expiryText);
		if (!normalizedExpiryText) {
			throw new Error('Expiry Text is required when setting expiration text');
		}
		payload.expiryText = normalizedExpiryText;
	} else if (expiryTextAction === 'clear') {
		payload.expiryText = null;
	}

	if (isActiveAction === 'activate') payload.isActive = true;
	if (isActiveAction === 'deactivate') payload.isActive = false;

	if (Object.keys(payload).length === 0) {
		throw new Error('Select at least one assignment field to update');
	}

	return payload;
};
