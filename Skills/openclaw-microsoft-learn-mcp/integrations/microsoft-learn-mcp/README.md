# Microsoft Learn MCP para OpenClaw

## Objetivo

Conectar OpenClaw con la documentación oficial y actualizada de Microsoft Learn mediante MCPorter.

Arquitectura:

```text
OpenClaw / Clippy
├── microsoft-docs
├── microsoft-code-reference
├── microsoft-skill-creator
└── MCPorter
    └── mcp-microsoft-learn
        └── https://learn.microsoft.com/api/mcp
```

## Requisitos

- Linux.
- OpenClaw instalado.
- MCPorter instalado y detectable por OpenClaw.
- Acceso HTTPS saliente a `learn.microsoft.com`.

La instalación de MCPorter se documenta en:

```text
openclaw-mcp-tooling/tools/mcporter/README.md
```

## Endpoint oficial

```text
https://learn.microsoft.com/api/mcp
```

Es un servidor MCP remoto mediante Streamable HTTP.

No requiere:

- API key;
- OAuth;
- usuario;
- contraseña.

## Herramientas disponibles

```text
microsoft_docs_search
microsoft_docs_fetch
microsoft_code_sample_search
```

## 1. Prueba previa sin persistencia

```bash
mcporter list   --http-url https://learn.microsoft.com/api/mcp   --name mcp-microsoft-learn   --brief   --timeout 120000
```

Resultado esperado:

```text
function microsoft_docs_search(query?: string): object;
function microsoft_code_sample_search(query: string, language?: string): object;
function microsoft_docs_fetch(url: string);
```

## 2. Simular el registro

```bash
mcporter config add   mcp-microsoft-learn   --scope home   --url https://learn.microsoft.com/api/mcp   --description "Official Microsoft Learn documentation and code samples"   --dry-run
```

## 3. Registrar el servidor

```bash
mcporter config add   mcp-microsoft-learn   --scope home   --url https://learn.microsoft.com/api/mcp   --description "Official Microsoft Learn documentation and code samples"
```

Configuración equivalente:

```json
{
  "mcpServers": {
    "mcp-microsoft-learn": {
      "baseUrl": "https://learn.microsoft.com/api/mcp",
      "description": "Official Microsoft Learn documentation and code samples"
    }
  }
}
```

No sobrescribas otros servidores ya existentes en `~/.mcporter/mcporter.json`.

## 4. Validar el registro

```bash
mcporter list   mcp-microsoft-learn   --status   --json   --timeout 120000
```

Y:

```bash
mcporter list   mcp-microsoft-learn   --brief   --timeout 120000
```

## 5. Probar las herramientas

### Buscar documentación

```bash
mcporter call   'mcp-microsoft-learn.microsoft_docs_search(query: "SharePoint Server 2019 supported SQL Server versions")'   --output markdown   --timeout 120000
```

### Buscar ejemplos oficiales

```bash
mcporter call   'mcp-microsoft-learn.microsoft_code_sample_search(query: "Microsoft Graph list SharePoint sites", language: "csharp")'   --output markdown   --timeout 120000
```

### Recuperar una página completa

```bash
mcporter call   'mcp-microsoft-learn.microsoft_docs_fetch(url: "URL_MICROSOFT_LEARN")'   --output markdown   --timeout 120000
```

## 6. Instalar las skills

Desde este directorio:

```bash
chmod +x install.sh
./install.sh
```

También puedes copiarlas manualmente:

```bash
for skill in microsoft-docs microsoft-code-reference microsoft-skill-creator; do
  mkdir -p "$HOME/skills/$skill"
  cp "skills/$skill/SKILL.md" "$HOME/skills/$skill/SKILL.md"
  chmod 700 "$HOME/skills/$skill"
  chmod 600 "$HOME/skills/$skill/SKILL.md"
done
```

## 7. Validar OpenClaw

```bash
openclaw skills info microsoft-docs --agent main
openclaw skills info microsoft-code-reference --agent main
openclaw skills info microsoft-skill-creator --agent main
openclaw skills check --agent main
```

Resultado esperado:

```text
✓ Ready
Visible to model: yes
Available as command: yes
```

## 8. Reiniciar el gateway

```bash
openclaw gateway restart
openclaw gateway status
```

## Pruebas funcionales

### microsoft-docs

```text
Usa microsoft-docs para consultar en Microsoft Learn qué versiones de SQL Server son compatibles con SharePoint Server 2019.
```

### microsoft-code-reference

```text
Usa microsoft-code-reference para verificar cómo listar sitios de SharePoint con Microsoft Graph SDK para .NET.
```

### microsoft-skill-creator

```text
Usa microsoft-skill-creator para diseñar una skill de gobierno de Power Platform sin instalarla todavía.
```

## Seguridad

- No envíes secretos ni datos confidenciales al MCP.
- No ejecutes comandos recuperados sin revisarlos.
- No presentes como actual información no verificada.
- No sustituyas documentación oficial por blogs cuando Microsoft Learn esté disponible.
- No incluyas `~/.mcporter/mcporter.json` real en Git.
