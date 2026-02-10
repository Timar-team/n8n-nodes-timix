#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"

mkdir -p "${DIST_DIR}/icons" "${DIST_DIR}/nodes/Timix"
cp -R "${PROJECT_DIR}/icons/." "${DIST_DIR}/icons/"
cp "${PROJECT_DIR}/icons/timix.svg" "${DIST_DIR}/nodes/Timix/timix.svg"
cp "${PROJECT_DIR}/icons/timix.dark.svg" "${DIST_DIR}/nodes/Timix/timix.dark.svg"
