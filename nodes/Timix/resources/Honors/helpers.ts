import type { IDataObject } from 'n8n-workflow';
import { normalizeOptionalString } from '../shared';

export const buildCreateHonorPayload = ({
	title,
	description,
	priority,
	fileUuid,
}: {
	title: string;
	description: string;
	priority: number;
	fileUuid?: unknown;
}): IDataObject => {
	const normalizedTitle = title.trim();
	const normalizedDescription = description.trim();

	if (!normalizedTitle) throw new Error('Title is required');
	if (normalizedTitle.length > 250) throw new Error('Title must be 250 characters or fewer');
	if (!normalizedDescription) throw new Error('Description is required');
	if (!Number.isInteger(priority) || priority < 0) {
		throw new Error('Priority must be an integer greater than or equal to 0');
	}

	const payload: IDataObject = {
		title: normalizedTitle,
		description: normalizedDescription,
		priority,
	};
	const normalizedFileUuid = normalizeOptionalString(fileUuid);
	if (normalizedFileUuid) payload.fileUuid = normalizedFileUuid;

	return payload;
};

export const buildUpdateHonorPayload = ({
	updateFields,
	fileAction,
	fileUuid,
}: {
	updateFields: Record<string, unknown>;
	fileAction: string;
	fileUuid?: unknown;
}): IDataObject => {
	const payload: IDataObject = {};

	if (Object.prototype.hasOwnProperty.call(updateFields, 'title')) {
		const title = normalizeOptionalString(updateFields.title);
		if (!title) throw new Error('Title cannot be empty');
		if (title.length > 250) throw new Error('Title must be 250 characters or fewer');
		payload.title = title;
	}

	if (Object.prototype.hasOwnProperty.call(updateFields, 'description')) {
		const description = normalizeOptionalString(updateFields.description);
		if (!description) throw new Error('Description cannot be empty');
		payload.description = description;
	}

	if (Object.prototype.hasOwnProperty.call(updateFields, 'priority')) {
		const priority = updateFields.priority;
		if (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 0) {
			throw new Error('Priority must be an integer greater than or equal to 0');
		}
		payload.priority = priority;
	}

	if (fileAction === 'set') {
		const normalizedFileUuid = normalizeOptionalString(fileUuid);
		if (!normalizedFileUuid) throw new Error('File UUID is required when setting an image');
		payload.fileUuid = normalizedFileUuid;
	} else if (fileAction === 'remove') {
		payload.fileUuid = null;
	}

	if (Object.keys(payload).length === 0) {
		throw new Error('Select at least one field to update');
	}

	return payload;
};
