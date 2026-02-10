# Timix Upload File

Upload one or more binary files to the Timix HR API and return the created file records.

## Credentials

This node uses the **Timix HR API** credential (`timixHrApi`). It must include a valid `baseUrl`.

## Inputs

Binary data is required. Each input item can contain one or more binary properties.

## Parameters

- `Folder` (required)
  Target folder on the Timix server. Options are:
  `skills`, `shifts`, `currencies`, `companies`, `departments`, `jobs`, `groups`, `groupsandemployees`, `employees`, `divisions`,
  `asset_trees`, `accesses`, `notes`, `dayoffs`, `education_levels`, `vacancies`, `transfers`, `skill_tests`, `trainings`, `tasks`,
  `task_assignments`, `task_topics`, `task_comments`, `assignment_files`, `documents`, `document_types`, `document_files`, `assets`,
  `asset_tree_properties`, `responsibilities`, `responsibles`, `responsibility_reviews`, `modified_files`, `skill_test_scores`, `offers`,
  `asset_fiches`, `asset_fich_items`, `educations`, `employee_relatives`, `candidates`.

- `Binary Properties` (required)
  Add binary property names one by one.
  Default: one entry with `data`.

## Behavior

- Sends a `POST /api/v2/file` request with multipart form data.
- Uploads up to **10 files** per input item.
- For each input item:
  - If the API response is an array, the node outputs **one item per file**.
  - If the API response is an object, the node outputs **a single item**.

## Errors

- **No binary properties provided** if the list is empty after trimming.
- **Maximum 10 files allowed per request** if more than 10 binary properties are provided.
- **Binary property "X" is missing** if a referenced binary property is not present.
- API errors are returned as standard n8n node errors.

## Example

If you have a previous node that produces binary data in the `data` property:

1. Set `Folder` to `tasks` (or any other allowed folder).
2. Keep `Binary Properties` as `data`.
3. Run the workflow.

The node will upload the file and return the file record(s) created by the Timix HR API.
