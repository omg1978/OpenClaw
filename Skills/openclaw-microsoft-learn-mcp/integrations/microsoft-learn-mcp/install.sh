#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SKILLS="${HOME}/skills"
MCP_NAME="mcp-microsoft-learn"
MCP_URL="https://learn.microsoft.com/api/mcp"

echo "== Comprobando MCPorter =="
if ! command -v mcporter >/dev/null 2>&1; then
  echo "ERROR: mcporter no está instalado o no está en PATH." >&2
  echo "Consulta openclaw-mcp-tooling/tools/mcporter/README.md" >&2
  exit 1
fi

mcporter --version

echo
echo "== Comprobando servidor MCP =="

if mcporter list "${MCP_NAME}" --status --json --timeout 120000 >/dev/null 2>&1; then
  echo "${MCP_NAME} ya está registrado."
else
  echo "Registrando ${MCP_NAME}..."
  mcporter config add     "${MCP_NAME}"     --scope home     --url "${MCP_URL}"     --description "Official Microsoft Learn documentation and code samples"
fi

echo
echo "== Validando herramientas =="
mcporter list "${MCP_NAME}" --brief --timeout 120000

echo
echo "== Instalando skills =="

for skill in microsoft-docs microsoft-code-reference microsoft-skill-creator; do
  source_file="${BASE_DIR}/skills/${skill}/SKILL.md"
  target_dir="${TARGET_SKILLS}/${skill}"

  if [[ ! -f "${source_file}" ]]; then
    echo "ERROR: falta ${source_file}" >&2
    exit 1
  fi

  mkdir -p "${target_dir}"
  install -m 600 "${source_file}" "${target_dir}/SKILL.md"
  chmod 700 "${target_dir}"

  echo "Instalada: ${target_dir}/SKILL.md"
done

echo
echo "== Validación OpenClaw =="
openclaw skills info microsoft-docs --agent main
openclaw skills info microsoft-code-reference --agent main
openclaw skills info microsoft-skill-creator --agent main
openclaw skills check --agent main

echo
echo "Instalación completada."
