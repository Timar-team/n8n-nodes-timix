# Timix

Timix HR actions grouped by Files and Tasks.

## Credentials

This node uses the **Timix HR API** credential (`timixHrApi`). It must include a valid `baseUrl`.

## Resources and operations

- **Files**
  - Upload File
  - Delete File (placeholder)
- **Tasks**
  - Create Task (placeholder)
  - Get Tasks (placeholder)

## Files > Upload File

Upload one or more binary files to the Timix HR API and return the created file records.

### Inputs

Binary data is required. Each input item can contain one or more binary properties.

### Parameters

- `Folder` (required)
  Target folder on the Timix server. Options are:
  `skills`, `shifts`, `currencies`, `companies`, `departments`, `jobs`, `groups`, `groupsandemployees`, `employees`, `divisions`,
  `asset_trees`, `accesses`, `notes`, `dayoffs`, `education_levels`, `vacancies`, `transfers`, `skill_tests`, `trainings`, `tasks`,
  `task_assignments`, `task_topics`, `task_comments`, `assignment_files`, `documents`, `document_types`, `document_files`, `assets`,
  `asset_tree_properties`, `responsibilities`, `responsibles`, `responsibility_reviews`, `modified_files`, `skill_test_scores`, `offers`,
  `asset_fiches`, `asset_fich_items`, `educations`, `employee_relatives`, `candidates`.

- `Binary Properties`
  Add binary property names one by one.
  If empty, the node uploads all binary properties from the input item.
- `Access Token Override` (optional)
  Provide a token manually or via expression to override the credential token for this request.

### Behavior

- Sends a `POST /api/v2/file` request with multipart form data.
- Uploads up to **10 files** per input item.
- For each input item:
  - If the API response is an array, the node outputs **one item per file**.
  - If the API response is an object, the node outputs **a single item**.

### Errors

- **No binary properties provided** if the list is empty after trimming.
- **Maximum 10 files allowed per request** if more than 10 binary properties are provided.
- **Binary property "X" is missing** if a referenced binary property is not present.
- API errors are returned as standard n8n node errors.

## Tasks > Create Task

### Parameters

- `Access Token Override` (optional)
  Provide a token manually or via expression to override the credential token for this request.
