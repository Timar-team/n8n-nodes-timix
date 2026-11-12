# Timix

Timix HR actions grouped by Chat, Employees, Employee Honors, Files, Honors, Offers, and Tasks.

## Credentials

This node uses the **Timix HR API** credential (`timixHrApi`). Configure the HR base URL and access token. The Files base URL is optional and falls back to the HR base URL for gateway installations.

## Resources and operations

- **Chat**
  - Add Message Reaction
  - Search Targets
  - Resolve Target
  - Create Poll
  - Send Message
- **Files**
  - Upload File
- **Employee**
  - Search for Honor Assignment
- **Employee Honor**
  - Assign
  - Get
  - Get Many
  - Update
  - Remove
- **Honor**
  - Create
  - Get
  - Get Many
  - Update
  - Delete
- **Offer**
  - Create Offer
  - Create Complaint
- **Tasks**
  - Create Task

## Global Parameters

- `Dynamic Credential` (optional)
  Provide a token manually or via expression to override the credential token for requests.

## Recommended Chat Flow

1. `Chat > Search Targets`
2. `Chat > Resolve Target`
3. `Files > Upload File` with `Folder=chat_messages` when a message has attachments
4. `Chat > Send Message`
5. `Chat > Create Poll` when you need a poll in the same conversation
6. `Chat > Add Message Reaction` when you want to react to a message

The node now follows the gateway-backed flow described by the API:

- `GET /api/v2/chat/targets/search`
- `POST /api/v2/chat/targets/resolve`
- `POST /api/v2/file`
- `POST /api/v2/chat/conversations/:uuid/messages`
- `POST /api/v2/chat/messages/:uuid/reactions`

## Chat > Add Message Reaction

Add an emoji or short reaction code to an existing message.

### Parameters

- `Message UUID` (required)
- `Reaction` (required, up to 32 characters)

### Behavior

- Sends `POST /api/v2/chat/messages/:uuid/reactions`
- Trims the reaction before sending `{ reaction }`

## Chat > Search Targets

Search available employees and structure chat targets.

### Parameters

- `Search` (required)
- `Limit`
- `Offset`

### Behavior

- Sends `GET /api/v2/chat/targets/search`
- Returns one n8n item per match

## Chat > Resolve Target

Resolve a target into a canonical or direct conversation.

### Parameters

- `Target Type` (required)
- `Target UUID` (required)

### Behavior

- Sends `POST /api/v2/chat/targets/resolve`
- Use the root-level `uuid` returned by Search Targets

## Chat > Send Message

Send a text, file, or audio message to a resolved conversation.

### Parameters

- `Conversation UUID` (required)
- `Message Type` (required)
- `Content`
- `File UUIDs`
- `Reply To Message UUID`
- `Thread Root Message UUID`
- `Scheduled At`
- `Expires At`
- `Mention All`
- `Out Box Pattern`
- `Mention Employee UUIDs`
- `Mention Division UUIDs`
- `Mention Department UUIDs`
- `Mention Group UUIDs`
- `Mention Job UUIDs`

### Validation

- Provide text content or at least one file UUID
- `File` and `Audio` message types require uploaded file UUIDs
- Blank file UUID rows are ignored before sending

## Chat > Create Poll

Create a poll in a resolved conversation.

### Parameters

- `Conversation UUID` (required)
- `Question` (required)
- `Options` (at least two non-empty values)
- `Is Multiple Choice`
- `Is Anonymous`
- `Results Visibility`
- `Allow Vote Change`
- `Expires At`
- `Reply To Message UUID`
- `Thread Root Message UUID`
- `Out Box Pattern`

### Validation

- Empty option rows are ignored
- At least two valid options are required
- `conversationUuid` is sent only in the URL path, not in the body

## Files > Upload File

Upload one or more binary files to the Timix HR API and return the created file UUIDs.

### Inputs

Binary data is required. Each input item can contain one or more binary properties.

### Parameters

- `Folder` (required)
  Target folder on the Timix server. Includes `chat_messages` for chat attachments.
- `Binary Properties`
  Add binary property names one by one.
  If empty, the node uploads all binary properties from the input item.

### Behavior

- Sends a `POST /api/v2/file` request with multipart form data
- Uploads up to **10 files** per input item
- Returns `uuids`, `fileUuids`, and raw `response` when file UUIDs can be extracted

### Errors

- **No binary properties found**
- **Maximum 10 files allowed per request**
- **Binary property "X" is missing**

## Offer > Create Offer / Create Complaint

Create an offer (suggestion) or a complaint in the company of the access token owner. Both operations use the same endpoint; the operation fixes the `type` field to `offer` or `complaint`, and it is not shown in the UI.

### Parameters

- `Title` (required)
- `Description` (required, multi-line)
- `Solution`: required for **Create Complaint**; optional for **Create Offer** (under Additional Fields)
- `Anonymous` (default `true`): when off, the record is created in the name of the owner of the credential's access token (or of the `Dynamic Credential` token, if set). The node cannot write an offer on behalf of another employee.
- `File UUIDs` (optional, one UUID per row, same as **Tasks > Create Task**): UUIDs of files already uploaded with `File > Upload` (`Folder=offers`), sent as `fileUuids`
- `Include Metadata`: return the full HR response envelope instead of only `payload`

### Validation (before any request)

- `Title` and `Description` must not be empty after trimming
- `Solution` must not be empty after trimming for complaints
- `Anonymous` is always sent as a JSON boolean; `"true"` / `"false"` strings from expressions are converted, anything else is rejected
- Blank `File UUIDs` rows are ignored and duplicates removed; with no UUIDs, `fileUuids` is not sent

### Behavior

1. Sends one `POST /api/v2/offers` request to the HR service with only `title`, `description`, `type`, `anonymity`, and, when present, `solution` and `fileUuids` (string array). Empty optional fields are omitted. The node does not upload files itself; use `File > Upload` before it.
2. Emits one item per input item containing the created record (`payload`). Create responses do not include `files`, `isActive`, `reviewerNote`, or `isOwn`, and `solution` only when it was sent.

### Not idempotent

Every successful run creates a new record and notifies employees with the `offers` permission. The node never retries these requests; avoid enabling **Retry On Fail** in the node settings.

### Errors

API errors are reported as `Creating the <offer|complaint> failed (HTTP <status>): <API message>` with a hint:

- **400** validation error, e.g. `If type = complaint then provide also solution`
- **401** token missing, invalid, or expired
- **404** `modified_files not found`: none of the given file UUIDs exist
- **419** the token owner's employee account is blocked
- **429** rate limit
- **5xx** on create: the record may or may not exist; check before running again

## Tasks > Create Task

Creates a Timix task using either form inputs or a raw JSON body.

## Honor workflow

1. Optionally upload an image with `File > Upload` and `Folder=honors`.
2. Create the reusable badge with `Honor > Create`. Use the first UUID returned by the upload as `File UUID`.
3. Find employee UUIDs with `Employee > Search for Honor Assignment`.
4. Connect the honor and employees with `Employee Honor > Assign`.

The Honor and Employee Honor list operations unwrap the HR `payload` by default and emit one n8n item per record. Enable `Include Metadata` to keep the complete HR response envelope.

Honor assignment uses public UUIDs only:

- `honorUuid` identifies the reusable honor definition.
- `employeeUuids` identifies one or more employees; do not use numeric employee IDs.
- `assignmentUuid` identifies an existing employee-honor assignment for get, update, and remove.

Assignment update fields expose explicit **Keep**, **Set**, and **Clear** actions so omitted fields remain unchanged while clear actions send `null` to the API.
