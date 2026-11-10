const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildCreateOfferPayload,
	describeOfferApiError,
	extractUploadedFileUuids,
	getApiErrorDetails,
	parseAttachmentPropertyNames,
} = require('../dist/nodes/Timix/resources/Offers/helpers.js');
const { executeOffer } = require('../dist/nodes/Timix/resources/Offers/execute.js');

const FILE_UUID_1 = '0b6f2a8e-3c1d-4f5a-9b7e-1a2b3c4d5e6f';
const FILE_UUID_2 = '7c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const OFFER_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

/**
 * Fake IExecuteFunctions. `responses` is consumed in order by each HTTP call;
 * an Error entry is thrown instead of returned.
 */
const createExecutionContext = (parameters, responses = [], binary = {}) => {
	const captured = [];
	const queue = [...responses];
	const context = {
		getNodeParameter(name, _itemIndex, defaultValue) {
			return Object.prototype.hasOwnProperty.call(parameters, name)
				? parameters[name]
				: defaultValue;
		},
		async getCredentials() {
			return {
				baseUrl: 'https://hr.example.test',
				filesBaseUrl: 'https://files.example.test',
				accessToken: 'token',
			};
		},
		getInputData() {
			return [{ json: { source: 'input' }, binary }];
		},
		getNode() {
			return {
				id: 'node-id',
				name: 'Timix',
				type: 'n8n-nodes-timix.timix',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			};
		},
		helpers: {
			async requestWithAuthentication(_credentialType, requestOptions) {
				captured.push(requestOptions);
				const next = queue.shift();
				if (next instanceof Error) throw next;
				return next;
			},
			async getBinaryDataBuffer(_itemIndex, propertyName) {
				return Buffer.from(`content of ${propertyName}`);
			},
		},
	};

	return { context, captured };
};

const createResponse = (payload) => ({ payload, delay: 15, timestamp: 1794297600000 });

const binaryFile = (fileName, mimeType) => ({ data: '', fileName, mimeType });

const httpError = (statusCode, body) =>
	Object.assign(new Error(`${statusCode} - ${JSON.stringify(body)}`), {
		statusCode,
		error: body,
	});

// --- Body building -------------------------------------------------------

test('offer payload trims values, sends a boolean anonymity and omits empty optional fields', () => {
	const payload = buildCreateOfferPayload({
		type: 'offer',
		title: '  Vejetaryen menü  ',
		description: '  Haftada iki gün olsun.  ',
		anonymity: true,
		solution: '   ',
		fileUuids: [],
	});

	assert.deepEqual(payload, {
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		type: 'offer',
		anonymity: true,
	});
	assert.equal(typeof payload.anonymity, 'boolean');
	assert.equal('solution' in payload, false);
	assert.equal('fileUuids' in payload, false);
});

test('offer payload keeps an optional solution and de-duplicated file UUIDs', () => {
	const payload = buildCreateOfferPayload({
		type: 'offer',
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		anonymity: false,
		solution: ' Salı ve perşembe ',
		fileUuids: [FILE_UUID_1, FILE_UUID_1, FILE_UUID_2],
	});

	assert.deepEqual(payload, {
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		type: 'offer',
		anonymity: false,
		solution: 'Salı ve perşembe',
		fileUuids: [FILE_UUID_1, FILE_UUID_2],
	});
});

test('complaint payload includes the solution and the complaint type', () => {
	const payload = buildCreateOfferPayload({
		type: 'complaint',
		title: 'Otopark',
		description: 'Akşam çok karanlık.',
		anonymity: true,
		solution: 'Ek lamba takılsın.',
	});

	assert.deepEqual(payload, {
		title: 'Otopark',
		description: 'Akşam çok karanlık.',
		type: 'complaint',
		anonymity: true,
		solution: 'Ek lamba takılsın.',
	});
});

test('anonymity strings from expressions become real booleans; other values are rejected', () => {
	const base = { type: 'offer', title: 'T', description: 'D' };

	assert.equal(buildCreateOfferPayload({ ...base, anonymity: 'true' }).anonymity, true);
	assert.equal(buildCreateOfferPayload({ ...base, anonymity: ' FALSE ' }).anonymity, false);
	assert.throws(
		() => buildCreateOfferPayload({ ...base, anonymity: 'yes' }),
		/Anonymous must be true or false/,
	);
	assert.throws(
		() => buildCreateOfferPayload({ ...base, anonymity: undefined }),
		/Anonymous must be true or false/,
	);
});

test('complaint without a solution is rejected', () => {
	for (const solution of [undefined, '', '   ']) {
		assert.throws(
			() =>
				buildCreateOfferPayload({
					type: 'complaint',
					title: 'Otopark',
					description: 'Akşam çok karanlık.',
					anonymity: true,
					solution,
				}),
			/Solution is required for complaints/,
		);
	}
});

test('blank title or description is rejected', () => {
	const base = { type: 'offer', title: 'T', description: 'D', anonymity: true };

	assert.throws(() => buildCreateOfferPayload({ ...base, title: '  ' }), /Title is required/);
	assert.throws(
		() => buildCreateOfferPayload({ ...base, description: '\n\t ' }),
		/Description is required/,
	);
});

// --- Attachments helpers -------------------------------------------------

test('attachment property names are split on commas, trimmed and de-duplicated', () => {
	assert.deepEqual(parseAttachmentPropertyNames(' data, data_1, ,data '), ['data', 'data_1']);
	assert.deepEqual(parseAttachmentPropertyNames(''), []);
	assert.deepEqual(parseAttachmentPropertyNames(undefined), []);
});

test('more than 10 attachments are rejected', () => {
	const names = Array.from({ length: 11 }, (_, index) => `file_${index}`).join(',');
	assert.throws(() => parseAttachmentPropertyNames(names), /Too many attachments: 11 given/);
});

test('uploaded file UUIDs are read from the bare array returned by the Files service', () => {
	const response = [
		{ uuid: FILE_UUID_1, name: 'a.pdf' },
		{ uuid: FILE_UUID_2, name: 'b.png' },
	];

	assert.deepEqual(extractUploadedFileUuids(response), [FILE_UUID_1, FILE_UUID_2]);
	assert.deepEqual(extractUploadedFileUuids(JSON.stringify(response)), [FILE_UUID_1, FILE_UUID_2]);
	assert.throws(
		() => extractUploadedFileUuids({ payload: response }),
		/expected an array of files/,
	);
});

// --- Operation: request and output ---------------------------------------

test('create offer sends only documented fields to POST /api/v2/offers and outputs the payload', async () => {
	const created = {
		uuid: OFFER_UUID,
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		type: 'offer',
		status: 'pending',
	};
	const { context, captured } = createExecutionContext(
		{
			title: 'Vejetaryen menü',
			description: 'Haftada iki gün olsun.',
			anonymity: true,
			additionalFields: {},
			includeMetadata: false,
		},
		[createResponse(created)],
	);

	const output = await executeOffer.call(context, 0, 'createOffer');

	assert.equal(captured.length, 1);
	assert.equal(captured[0].method, 'POST');
	assert.equal(captured[0].url, '/api/v2/offers');
	assert.equal(captured[0].baseURL, 'https://hr.example.test');
	assert.equal(captured[0].json, true);
	assert.deepEqual(captured[0].body, {
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		type: 'offer',
		anonymity: true,
	});
	assert.deepEqual(output, [{ json: created, pairedItem: { item: 0 } }]);
});

test('create complaint sends type complaint with the solution', async () => {
	const { context, captured } = createExecutionContext(
		{
			title: 'Otopark',
			description: 'Akşam çok karanlık.',
			solution: 'Ek lamba takılsın.',
			anonymity: false,
		},
		[createResponse({ uuid: OFFER_UUID, type: 'complaint' })],
	);

	await executeOffer.call(context, 0, 'createComplaint');

	assert.deepEqual(captured[0].body, {
		title: 'Otopark',
		description: 'Akşam çok karanlık.',
		type: 'complaint',
		anonymity: false,
		solution: 'Ek lamba takılsın.',
	});
});

test('create complaint without a solution fails before any request', async () => {
	const { context, captured } = createExecutionContext(
		{
			title: 'Otopark',
			description: 'Akşam çok karanlık.',
			solution: '   ',
			anonymity: true,
			additionalFields: { attachments: 'data' },
		},
		[],
		{ data: binaryFile('photo.jpg', 'image/jpeg') },
	);

	await assert.rejects(executeOffer.call(context, 0, 'createComplaint'), (error) => {
		assert.equal(error.name, 'NodeOperationError');
		assert.match(error.message, /Solution is required for complaints/);
		assert.equal(error.context.itemIndex, 0);
		return true;
	});
	assert.equal(captured.length, 0);
});

test('Include Metadata returns the full HR envelope', async () => {
	const response = createResponse({ uuid: OFFER_UUID });
	const { context } = createExecutionContext(
		{ title: 'T', description: 'D', anonymity: true, includeMetadata: true },
		[response],
	);

	const output = await executeOffer.call(context, 0, 'createOffer');

	assert.deepEqual(output[0].json, response);
});

// --- Operation: attachment upload -> fileUuids ---------------------------

test('attachments are uploaded to folder offers first and their UUIDs sent as fileUuids', async () => {
	const { context, captured } = createExecutionContext(
		{
			title: 'Otopark',
			description: 'Akşam çok karanlık.',
			solution: 'Ek lamba takılsın.',
			anonymity: true,
			additionalFields: { attachments: 'data, data_1' },
		},
		[
			[
				{ uuid: FILE_UUID_1, name: 'photo.jpg' },
				{ uuid: FILE_UUID_2, name: 'plan.pdf' },
			],
			createResponse({ uuid: OFFER_UUID, type: 'complaint' }),
		],
		{
			data: binaryFile('photo.jpg', 'image/jpeg'),
			data_1: binaryFile('plan.pdf', 'application/pdf'),
		},
	);

	const output = await executeOffer.call(context, 0, 'createComplaint');

	assert.equal(captured.length, 2);

	const [upload, create] = captured;
	assert.equal(upload.method, 'POST');
	assert.equal(upload.url, '/api/v2/file');
	assert.equal(upload.baseURL, 'https://files.example.test');
	assert.equal(upload.formData.folder, 'offers');
	assert.deepEqual(
		upload.formData.files.map((file) => file.options),
		[
			{ filename: 'photo.jpg', contentType: 'image/jpeg' },
			{ filename: 'plan.pdf', contentType: 'application/pdf' },
		],
	);
	assert.equal(upload.formData.files[0].value.toString(), 'content of data');
	// The multipart boundary is left to the HTTP client.
	assert.equal(upload.headers?.['Content-Type'], undefined);

	assert.equal(create.url, '/api/v2/offers');
	assert.equal(create.baseURL, 'https://hr.example.test');
	assert.deepEqual(create.body, {
		title: 'Otopark',
		description: 'Akşam çok karanlık.',
		type: 'complaint',
		anonymity: true,
		solution: 'Ek lamba takılsın.',
		fileUuids: [FILE_UUID_1, FILE_UUID_2],
	});
	assert.deepEqual(output[0].json, { uuid: OFFER_UUID, type: 'complaint' });
});

test('offer solution and attachments come from Additional Fields', async () => {
	const { context, captured } = createExecutionContext(
		{
			title: 'Vejetaryen menü',
			description: 'Haftada iki gün olsun.',
			anonymity: true,
			additionalFields: { solution: 'Salı ve perşembe', attachments: 'data' },
		},
		[[{ uuid: FILE_UUID_1 }], createResponse({ uuid: OFFER_UUID })],
		{ data: binaryFile('menu.pdf', 'application/pdf') },
	);

	await executeOffer.call(context, 0, 'createOffer');

	assert.equal(captured[0].formData.folder, 'offers');
	assert.deepEqual(captured[1].body, {
		title: 'Vejetaryen menü',
		description: 'Haftada iki gün olsun.',
		type: 'offer',
		anonymity: true,
		solution: 'Salı ve perşembe',
		fileUuids: [FILE_UUID_1],
	});
});

test('more than 10 attachments fail before uploading anything', async () => {
	const names = Array.from({ length: 11 }, (_, index) => `file_${index}`);
	const binary = Object.fromEntries(names.map((name) => [name, binaryFile(`${name}.txt`)]));
	const { context, captured } = createExecutionContext(
		{
			title: 'T',
			description: 'D',
			anonymity: true,
			additionalFields: { attachments: names.join(',') },
		},
		[],
		binary,
	);

	await assert.rejects(executeOffer.call(context, 0, 'createOffer'), /Too many attachments/);
	assert.equal(captured.length, 0);
});

test('a missing binary property fails before uploading anything', async () => {
	const { context, captured } = createExecutionContext(
		{
			title: 'T',
			description: 'D',
			anonymity: true,
			additionalFields: { attachments: 'data, nope' },
		},
		[],
		{ data: binaryFile('a.txt', 'text/plain') },
	);

	await assert.rejects(
		executeOffer.call(context, 0, 'createOffer'),
		/Binary property "nope" is missing/,
	);
	assert.equal(captured.length, 0);
});

test('an upload response without UUIDs stops before creating the offer', async () => {
	const { context, captured } = createExecutionContext(
		{ title: 'T', description: 'D', anonymity: true, additionalFields: { attachments: 'data' } },
		[[]],
		{ data: binaryFile('a.txt', 'text/plain') },
	);

	await assert.rejects(
		executeOffer.call(context, 0, 'createOffer'),
		/Attachment upload returned no file UUIDs, so the offer was not created/,
	);
	assert.equal(captured.length, 1);
});

// --- Operation: API errors -----------------------------------------------

test('a 400 from the API is reported with its status and message and is not retried', async () => {
	const { context, captured } = createExecutionContext(
		{ title: 'Otopark', description: 'D', solution: 'S', anonymity: true },
		[
			httpError(400, {
				message: 'If type = complaint then provide also solution',
				statusCode: 400,
			}),
		],
	);

	await assert.rejects(executeOffer.call(context, 0, 'createComplaint'), (error) => {
		assert.equal(error.name, 'NodeApiError');
		assert.equal(
			error.message,
			'Creating the complaint failed (HTTP 400): If type = complaint then provide also solution',
		);
		assert.equal(error.httpCode, '400');
		assert.equal(error.context.itemIndex, 0);
		return true;
	});
	assert.equal(captured.length, 1);
});

test('a 404 for unknown file UUIDs explains the modified_files error', async () => {
	// n8n may wrap the request error; the original sits under `cause`.
	const wrapped = Object.assign(new Error('The resource you are requesting could not be found'), {
		cause: httpError(404, { message: 'modified_files not found' }),
	});
	const { context } = createExecutionContext(
		{ title: 'T', description: 'D', anonymity: true, additionalFields: { attachments: 'data' } },
		[[{ uuid: FILE_UUID_1 }], wrapped],
		{ data: binaryFile('a.txt', 'text/plain') },
	);

	await assert.rejects(executeOffer.call(context, 0, 'createOffer'), (error) => {
		assert.equal(error.message, 'Creating the offer failed (HTTP 404): modified_files not found');
		assert.match(error.description, /None of the attached file UUIDs were found/);
		return true;
	});
});

test('a 413 during upload is reported as an attachment upload failure', async () => {
	const { context, captured } = createExecutionContext(
		{ title: 'T', description: 'D', anonymity: true, additionalFields: { attachments: 'data' } },
		[httpError(413, { message: 'Storage limit exceeded' })],
		{ data: binaryFile('big.zip', 'application/zip') },
	);

	await assert.rejects(executeOffer.call(context, 0, 'createOffer'), (error) => {
		assert.equal(error.message, 'Attachment upload failed (HTTP 413): Storage limit exceeded');
		assert.match(error.description, /200 MB/);
		return true;
	});
	assert.equal(captured.length, 1);
});

test('errors without an HTTP status are rethrown unchanged', async () => {
	const networkError = new Error('connect ECONNREFUSED 127.0.0.1:3001');
	const { context } = createExecutionContext({ title: 'T', description: 'D', anonymity: true }, [
		networkError,
	]);

	await assert.rejects(executeOffer.call(context, 0, 'createOffer'), (error) => {
		assert.equal(error, networkError);
		return true;
	});
});

test('API error details are read from common n8n error shapes', () => {
	assert.deepEqual(getApiErrorDetails({ httpCode: '419', description: 'x' }), { status: 419 });
	assert.deepEqual(
		getApiErrorDetails({
			response: { status: 400, data: { message: ['title should not be empty', 'x'] } },
		}),
		{ status: 400, message: 'title should not be empty; x' },
	);
	assert.deepEqual(getApiErrorDetails({ statusCode: 401, error: '{"message":"Unauthorized"}' }), {
		status: 401,
		message: 'Unauthorized',
	});
	assert.deepEqual(
		describeOfferApiError('create', 'offer', { status: 502 }).description,
		'The offer may or may not have been created. Check before running again: a repeated request creates a duplicate and sends notifications again.',
	);
});
