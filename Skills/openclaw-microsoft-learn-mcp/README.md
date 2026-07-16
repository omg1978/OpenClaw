# OpenClaw Microsoft Learn MCP

Integración de Microsoft Learn MCP para OpenClaw mediante MCPorter.

Este repositorio documenta:

- el registro del servidor remoto `mcp-microsoft-learn` en MCPorter;
- la validación de las herramientas oficiales de Microsoft Learn;
- la instalación de tres skills de OpenClaw:
  - `microsoft-docs`;
  - `microsoft-code-reference`;
  - `microsoft-skill-creator`.

## Dependencia previa

MCPorter debe estar instalado y accesible para OpenClaw.

La instalación y configuración base de MCPorter se documenta en el proyecto:

```text
openclaw-mcp-tooling
```

Ruta esperada dentro de ese proyecto:

```text
tools/mcporter/README.md
```

Este repositorio no duplica la instalación de MCPorter.

## Estructura

```text
.
├── integrations/
│   └── microsoft-learn-mcp/
│       ├── README.md
│       ├── install.sh
│       ├── examples/
│       │   └── mcporter-microsoft-learn.example.json
│       └── skills/
│           ├── microsoft-docs/
│           │   └── SKILL.md
│           ├── microsoft-code-reference/
│           │   └── SKILL.md
│           └── microsoft-skill-creator/
│               └── SKILL.md
├── .gitignore
└── README.md
```

## Instalación rápida

```bash
cd integrations/microsoft-learn-mcp
chmod +x install.sh
./install.sh
```

El script:

1. comprueba que `mcporter` existe;
2. registra `mcp-microsoft-learn` si todavía no existe;
3. valida las tres herramientas MCP;
4. instala las tres skills en `~/skills`;
5. ejecuta las comprobaciones de OpenClaw.

## Seguridad

- El endpoint no requiere API key.
- No se almacenan secretos en este repositorio.
- No subas tu `~/.mcporter/mcporter.json` real.
- Usa únicamente el endpoint oficial:
  `https://learn.microsoft.com/api/mcp`.
