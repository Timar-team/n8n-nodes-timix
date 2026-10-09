const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildAddMessageReactionPayload,
	buildCreatePollPayload,
	buildPollOptions,
	buildSendMessagePayload,
} = require('../dist/nodes/Timix/resources/Chat/helpers.js');
const {
	addMessageReaction,
} = require('../dist/nodes/Timix/resources/Chat/addMessageReaction.js');

const createExecutionContext = (parameters, response) => {
	const captured = [];
	const context = {
		getNodeParameter(name, _itemIndex, defaultValue) {
			return Object.prototype.hasOwnProperty.call(parameters, name)
				? parameters[name]
				: defaultValue;
		},
		async getCredentials() {
			return { baseUrl: 'https://hr.example.test', accessToken: 'token' };
		},
		helpers: {
			async requestWithAuthentication(_credentialType, requestOptions) {
				captured.push(requestOptions);
				return response;
			},
		},
	};

	return { context, captured };
};

test('add message reaction payload trims the reaction', () => {
	assert.deepEqual(buildAddMessageReactionPayload('  👍  '), { reaction: '👍' });
});

test('add message reaction payload rejects blank and oversized reactions', () => {
	assert.throws(() => buildAddMessageReactionPayload('   '), /Reaction is required/);
	assert.throws(
		() => buildAddMessageReactionPayload('a'.repeat(33)),
		/Reaction must be 32 characters or fewer/,
	);
});

test('add message reaction operation sends the documented endpoint and body', async () => {
	const response = { uuid: 'message-uuid', reactions: [{ reaction: '👍', count: 1 }] };
	const { context, captured } = createExecutionContext(
		{ messageUuid: 'message-uuid', reaction: ' 👍 ' },
		response,
	);

	const output = await addMessageReaction.call(context, 0);

	assert.equal(captured[0].method, 'POST');
	assert.equal(captured[0].url, '/api/v2/chat/messages/message-uuid/reactions');
	assert.equal(captured[0].baseURL, 'https://hr.example.test');
	assert.deepEqual(captured[0].body, { reaction: '👍' });
	assert.deepEqual(output[0].json, response);
});

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
