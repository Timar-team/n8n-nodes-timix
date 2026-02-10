#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="$(node -p "require('${PROJECT_DIR}/package.json').name" 2>/dev/null || true)"

if [[ -z "${PACKAGE_NAME}" ]]; then
	echo "Error: Could not read package name from package.json."
	exit 1
fi

DEFAULT_CUSTOM_DIR="/home/testproject/n8n-compose/data/custom"
CUSTOM_DIR="${N8N_CUSTOM_DIR:-}"

if [[ -z "${CUSTOM_DIR}" ]]; then
	if [[ -d "${DEFAULT_CUSTOM_DIR}" ]]; then
		CUSTOM_DIR="${DEFAULT_CUSTOM_DIR}"
	else
		echo "Error: N8N_CUSTOM_DIR is not set and default not found: ${DEFAULT_CUSTOM_DIR}"
		echo "Set N8N_CUSTOM_DIR to your n8n custom extensions folder."
		exit 1
	fi
fi

TARGET_DIR="${CUSTOM_DIR%/}/${PACKAGE_NAME}"

if [[ "${PROJECT_DIR}" == "${TARGET_DIR}" ]]; then
	echo "Project is already in target directory: ${TARGET_DIR}"
	echo "Skipping deploy copy."
	exit 0
fi

SOURCE_DIR="${PROJECT_DIR}/dist"
if [[ ! -d "${SOURCE_DIR}" ]]; then
	echo "Error: dist folder not found. Run npm run build first."
	exit 1
fi

echo "Deploying build output to: ${TARGET_DIR}"
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

cp -R "${SOURCE_DIR}/." "${TARGET_DIR}/"
cp "${PROJECT_DIR}/package.json" "${TARGET_DIR}/package.json"

echo "Deploy completed."
