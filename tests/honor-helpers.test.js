const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildCreateHonorPayload,
	buildUpdateHonorPayload,
} = require('../dist/nodes/Timix/resources/Honors/helpers.js');
const {
	buildAssignHonorPayload,
	buildUpdateAssignmentPayload,
} = require('../dist/nodes/Timix/resources/EmployeeHonors/helpers.js');
const { unwrapHrPayload } = require('../dist/nodes/Timix/resources/shared.js');
const { executeHonor } = require('../dist/nodes/Timix/resources/Honors/execute.js');
const { executeEmployeeHonor } = require('../dist/nodes/Timix/resources/EmployeeHonors/execute.js');

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

test('create honor trims values and omits an empty file UUID', () => {
	const payload = buildCreateHonorPayload({
		title: '  Ayın Çalışanı  ',
		description: '  Olağanüstü performans  ',
		priority: 100,
		fileUuid: '   ',
	});

	assert.deepEqual(payload, {
		title: 'Ayın Çalışanı',
		description: 'Olağanüstü performans',
		priority: 100,
	});
});

test('update honor explicitly removes an image with null', () => {
	const payload = buildUpdateHonorPayload({
		updateFields: {},
		fileAction: 'remove',
	});

	assert.deepEqual(payload, { fileUuid: null });
});

test('assign honor de-duplicates employee UUIDs and omits blank optional fields', () => {
	const payload = buildAssignHonorPayload({
		honorUuid: 'honor-uuid',
		employeeUuids: ['employee-1', 'employee-1', 'employee-2'],
		expiresAt: '',
		expiryText: '  ',
		isActive: false,
	});

	assert.deepEqual(payload, {
		honorUuid: 'honor-uuid',
		employeeUuids: ['employee-1', 'employee-2'],
		isActive: false,
	});
});

test('update assignment distinguishes clearing from preserving fields', () => {
	const payload = buildUpdateAssignmentPayload({
		expiresAtAction: 'clear',
		expiryTextAction: 'keep',
		isActiveAction: 'deactivate',
	});

	assert.deepEqual(payload, { expiresAt: null, isActive: false });
});

test('update assignment rejects a no-op request', () => {
	assert.throws(
		() =>
			buildUpdateAssignmentPayload({
				expiresAtAction: 'keep',
				expiryTextAction: 'keep',
				isActiveAction: 'keep',
			}),
		/Select at least one assignment field to update/,
	);
});

test('HR response payload is unwrapped while direct responses are preserved', () => {
	assert.deepEqual(unwrapHrPayload({ payload: [{ uuid: 'one' }], delay: 10 }), [{ uuid: 'one' }]);
	assert.deepEqual(unwrapHrPayload([{ uuid: 'file' }]), [{ uuid: 'file' }]);
});

test('create honor operation sends the documented endpoint and body', async () => {
	const { context, captured } = createExecutionContext(
		{
			includeMetadata: false,
			title: 'Ayın Çalışanı',
			description: 'Başarılı performans',
			priority: 10,
			fileUuid: 'file-uuid',
		},
		{ payload: { uuid: 'honor-uuid' }, delay: 1 },
	);

	const output = await executeHonor.call(context, 0, 'create');

	assert.equal(captured[0].method, 'POST');
	assert.equal(captured[0].url, '/api/v2/honors');
	assert.equal(captured[0].baseURL, 'https://hr.example.test');
	assert.deepEqual(captured[0].body, {
		title: 'Ayın Çalışanı',
		description: 'Başarılı performans',
		priority: 10,
		fileUuid: 'file-uuid',
	});
	assert.deepEqual(output[0].json, { uuid: 'honor-uuid' });
});

test('assign operation sends honor and employee UUIDs to employee-honors', async () => {
	const { context, captured } = createExecutionContext(
		{
			includeMetadata: false,
			honorUuid: 'honor-uuid',
			employeeUuids: { values: [{ uuid: 'employee-uuid' }] },
			expiresAt: '',
			expiryText: 'Süresiz',
			isActive: true,
		},
		{ payload: [{ uuid: 'assignment-uuid' }] },
	);

	const output = await executeEmployeeHonor.call(context, 0, 'assign');

	assert.equal(captured[0].method, 'POST');
	assert.equal(captured[0].url, '/api/v2/employee-honors');
	assert.deepEqual(captured[0].body, {
		honorUuid: 'honor-uuid',
		employeeUuids: ['employee-uuid'],
		expiryText: 'Süresiz',
		isActive: true,
	});
	assert.deepEqual(output[0].json, { uuid: 'assignment-uuid' });
});
