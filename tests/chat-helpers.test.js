const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildCreatePollPayload,
	buildPollOptions,
	buildSendMessagePayload,
} = require('../dist/nodes/Timix/resources/Chat/helpers.js');

test('buildPollOptions removes empty values and keeps valid texts', () => {
	const options = buildPollOptions({
		values: [{ text: '' }, { text: '  Pizza  ' }, { text: null }, { text: 'Doner' }],
	});

	assert.deepEqual(options, [{ text: 'Pizza' }, { text: 'Doner' }]);
});

test('create poll payload requires at least two valid options', () => {
	assert.throws(
		() =>
			buildCreatePollPayload({
				question: 'Lunch?',
				options: [{ text: 'Pizza' }],
				isMultipleChoice: false,
				isAnonymous: false,
				resultsVisibility: 'always',
				allowVoteChange: false,
			}),
		/At least two poll options are required/,
	);
});

test('create poll payload preserves boolean false values', () => {
	const payload = buildCreatePollPayload({
		question: 'Lunch?',
		options: [{ text: 'Pizza' }, { text: 'Doner' }],
		isMultipleChoice: false,
		isAnonymous: false,
		resultsVisibility: 'always',
		allowVoteChange: false,
	});

	assert.equal(payload.isMultipleChoice, false);
	assert.equal(payload.isAnonymous, false);
	assert.equal(payload.allowVoteChange, false);
	assert.equal(payload.resultsVisibility, 'always');
});

test('send message payload sends mentionAll true', () => {
	const payload = buildSendMessagePayload({
		messageType: 'text',
		content: 'Meeting soon',
		fileUuids: [],
		mentionAll: true,
		mentionEmployeeUuids: [],
		mentionDivisionUuids: [],
		mentionDepartmentUuids: [],
		mentionGroupUuids: [],
		mentionJobUuids: [],
	});

	assert.equal(payload.mentionAll, true);
});

test('send message payload sends mentionAll false and filters blank file uuids', () => {
	const payload = buildSendMessagePayload({
		messageType: 'text',
		content: 'Hello',
		fileUuids: ['', '  ', 'valid-uuid'],
		mentionAll: false,
		mentionEmployeeUuids: [],
		mentionDivisionUuids: [],
		mentionDepartmentUuids: [],
		mentionGroupUuids: [],
		mentionJobUuids: [],
	});

	assert.equal(payload.mentionAll, false);
	assert.deepEqual(payload.fileUuids, ['valid-uuid']);
});
