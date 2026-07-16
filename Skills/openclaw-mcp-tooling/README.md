# OpenClaw MCP Tooling

Repositorio para centralizar herramientas e integraciones MCP utilizadas por OpenClaw.

## Estructura

```text
.
├── tools/
│   └── mcporter/
│       └── README.md
├── integrations/
│   └── playwright-mcp/
│       ├── README.md
│       ├── examples/
│       │   ├── mcporter-playwright.example.json
│       │   └── playwright-mcp.example.json
│       └── skill/
│           └── browser-automation/
│               └── SKILL.md
└── .gitignore
```

## Criterio de organización

- `tools/mcporter`: instalación y mantenimiento de MCPorter como herramienta común para cualquier integración MCP.
- `integrations/<servidor-mcp>`: configuración, validación y skills asociadas a un servidor MCP concreto.
- `skill/<nombre-skill>`: skill de OpenClaw dependiente de esa integración.

Con esta estructura, futuros servidores MCP como Microsoft Learn pueden añadirse sin duplicar la instalación de MCPorter:

```text
integrations/
├── playwright-mcp/
└── microsoft-learn-mcp/
```
