# Timix

Timix HR actions grouped by Chat, Files, and Tasks.

## Credentials

This node uses the **Timix HR API** credential (`timixHrApi`). It must include a valid `baseUrl`.

## Resources and operations

- **Chat**
  - Search Targets
  - Resolve Target
  - Send Message
- **Files**
  - Upload File
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

The node now follows the gateway-backed flow described by the API:

- `GET /api/v2/chat/targets/search`
- `POST /api/v2/chat/targets/resolve`
- `POST /api/v2/file`
- `POST /api/v2/chat/conversations/:uuid/messages`

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

## Tasks > Create Task

Creates a Timix task using either form inputs or a raw JSON body.
