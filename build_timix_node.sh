#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAST_PATH_FILE="${SCRIPT_DIR}/.timix_last_path"
PROJECT_DIR="${SCRIPT_DIR}"

echo "Timix build script started."

if ! command -v node >/dev/null 2>&1; then
	echo "Error: Node.js is required but not found in PATH."
	exit 1
fi

PACKAGE_NAME="$(node -p "require('${PROJECT_DIR}/package.json').name" 2>/dev/null || true)"
if [[ -z "${PACKAGE_NAME}" ]]; then
	echo "Error: Could not read package name from package.json."
	exit 1
fi

echo "Detected package name: ${PACKAGE_NAME}"

echo "Choose mode:"
echo "1) Update (reuse last path)"
echo "2) Fresh setup (ask path, no Docker restart)"
read -r -p "Selection (1/2): " MODE

if [[ "${MODE}" != "1" && "${MODE}" != "2" ]]; then
	echo "Invalid selection."
	exit 1
fi

if [[ "${MODE}" == "1" ]]; then
	if [[ -f "${LAST_PATH_FILE}" ]]; then
		CUSTOM_DIR="$(cat "${LAST_PATH_FILE}")"
		echo "Using last path: ${CUSTOM_DIR}"
	else
		echo "No saved path found. Please run Fresh setup first."
		exit 1
	fi
else
	read -r -p "Where is your n8n custom extensions folder? (example: ~/.n8n/custom): " CUSTOM_DIR
fi

if [[ -z "${CUSTOM_DIR}" ]]; then
	echo "Error: Folder path cannot be empty."
	exit 1
fi

# Expand ~ manually
if [[ "${CUSTOM_DIR}" == "~"* ]]; then
	CUSTOM_DIR="${CUSTOM_DIR/#\~/$HOME}"
fi

if [[ ! -d "${CUSTOM_DIR}" ]]; then
	echo "Folder not found: ${CUSTOM_DIR}"
	read -r -p "Create it now? (y/N): " CREATE_DIR
	if [[ "${CREATE_DIR}" == "y" || "${CREATE_DIR}" == "Y" ]]; then
		mkdir -p "${CUSTOM_DIR}"
		echo "Folder created: ${CUSTOM_DIR}"
	else
		echo "Canceled."
		exit 1
	fi
fi

# Prevent installing into a subdirectory of the project to avoid recursive node_modules
if [[ "${CUSTOM_DIR}" == "${PROJECT_DIR}"* ]]; then
	echo "Error: Custom extensions folder cannot be inside the project directory."
	echo "Project directory: ${PROJECT_DIR}"
	exit 1
fi

if [[ "${MODE}" == "2" ]]; then
	echo "Saving path to ${LAST_PATH_FILE}"
	echo "${CUSTOM_DIR}" > "${LAST_PATH_FILE}"
fi

TARGET_DIR="${CUSTOM_DIR%/}/${PACKAGE_NAME}"

echo "Checking dependencies..."
if [[ ! -d "${PROJECT_DIR}/node_modules" ]]; then
	echo "node_modules not found. Running npm install..."
	npm install
else
	echo "node_modules already exists."
fi

echo "Starting build..."
npm run build
echo "Build finished."

echo "Deploying build output..."
if [[ ! -d "${PROJECT_DIR}/dist" ]]; then
	echo "Error: dist folder not found. Did the build succeed?"
	exit 1
fi

mkdir -p "${TARGET_DIR}"
rm -rf "${TARGET_DIR}/dist"
cp -R "${PROJECT_DIR}/dist" "${TARGET_DIR}/dist"
cp "${PROJECT_DIR}/package.json" "${TARGET_DIR}/package.json"
echo "Deployed to: ${TARGET_DIR}"

if [[ "${MODE}" == "1" ]]; then
	if command -v docker >/dev/null 2>&1; then
		echo "Getting Docker container list..."
		mapfile -t CONTAINERS < <(docker ps --format '{{.ID}}::{{.Names}}')

		if [[ ${#CONTAINERS[@]} -gt 0 ]]; then
			echo "Select a container to restart:"
			for i in "${!CONTAINERS[@]}"; do
				NAME="${CONTAINERS[$i]#*::}"
				printf "%s) %s\n" "$((i + 1))" "${NAME}"
			done
			echo "0) Skip"
			read -r -p "Your choice: " CHOICE

			if [[ "${CHOICE}" =~ ^[0-9]+$ ]] && [[ "${CHOICE}" -gt 0 ]] && [[ "${CHOICE}" -le ${#CONTAINERS[@]} ]]; then
				SELECTED="${CONTAINERS[$((CHOICE - 1))]}"
				CONTAINER_ID="${SELECTED%%::*}"
				CONTAINER_NAME="${SELECTED#*::}"
				echo "Restarting: ${CONTAINER_NAME}"
				docker restart "${CONTAINER_ID}" >/dev/null
				echo "Docker restart completed."
			else
				echo "Docker restart skipped."
			fi
		else
			echo "No running containers found. Docker restart skipped."
		fi
	else
		echo "Docker not found. Docker restart skipped."
	fi
fi

echo "All done."
