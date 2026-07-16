# Playwright MCP + browser-automation

Esta integración añade automatización web a OpenClaw mediante:

```text
OpenClaw
  └── browser-automation
       └── MCPorter
            └── mcp-playwright
                 └── Chromium aislado y headless
```

MCPorter debe estar instalado previamente siguiendo:

```text
tools/mcporter/README.md
```

## 1. Crear la configuración de Playwright MCP

```bash
mkdir -p "$HOME/.mcporter"
chmod 700 "$HOME/.mcporter"
```

Crea:

```bash
cat > "$HOME/.mcporter/playwright-mcp.json" <<'EOF'
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "launchOptions": {
      "headless": true
    }
  },
  "codegen": "none"
}
EOF

chmod 600 "$HOME/.mcporter/playwright-mcp.json"
```

## 2. Registrar el servidor en MCPorter

Añade a `~/.mcporter/mcporter.json`:

```json
{
  "mcpServers": {
    "mcp-playwright": {
      "command": "/usr/bin/npx",
      "args": [
        "-y",
        "@playwright/mcp@0.0.78",
        "--config",
        "/home/USUARIO/.mcporter/playwright-mcp.json"
      ],
      "description": "Browser automation using Microsoft Playwright MCP",
      "blockedTools": [
        "browser_run_code_unsafe"
      ]
    }
  }
}
```

No sobrescribas otros servidores MCP ya existentes. Integra únicamente la propiedad `mcp-playwright`.

Protege la configuración:

```bash
chmod 600 "$HOME/.mcporter/mcporter.json"
```

## 3. Instalar Chromium compatible

Versión validada con `@playwright/mcp@0.0.78`:

```bash
npx -y \
  playwright@1.62.0-alpha-1783623505000 \
  install chromium
```

Comprueba:

```bash
npx -y \
  playwright@1.62.0-alpha-1783623505000 \
  install --list
```

Si faltan librerías del sistema:

```bash
sudo npx -y \
  playwright@1.62.0-alpha-1783623505000 \
  install-deps chromium
```

## 4. Validar el servidor MCP

```bash
mcporter list \
  mcp-playwright \
  --status \
  --json \
  --timeout 120000
```

Prueba de navegación:

```bash
mcporter call \
  'mcp-playwright.browser_navigate(url: "https://www.microsoft.com")' \
  --timeout 120000
```

Prueba del bloqueo:

```bash
mcporter call \
  'mcp-playwright.browser_run_code_unsafe(code: "() => 1")'
```

La última llamada debe fallar indicando que la herramienta está bloqueada.

## 5. Instalar la skill browser-automation

Desde la raíz del repositorio:

```bash
mkdir -p "$HOME/skills/browser-automation"

cp integrations/playwright-mcp/skill/browser-automation/SKILL.md \
  "$HOME/skills/browser-automation/SKILL.md"

chmod 700 "$HOME/skills/browser-automation"
chmod 600 "$HOME/skills/browser-automation/SKILL.md"
```

No es necesario ejecutar `openclaw skills install` si `~/skills` ya es el directorio de skills del workspace.

## 6. Validar en OpenClaw

```bash
openclaw skills info browser-automation --agent main
openclaw skills check --agent main
```

Resultado esperado:

```text
browser-automation ✓ Ready
Visible to model: yes
Available as command: yes
```

## 7. Reiniciar el gateway

```bash
openclaw gateway restart
openclaw gateway status
```

## 8. Prueba desde el agente

```text
Usa browser-automation para abrir https://www.microsoft.com,
obtener el título y resumir las secciones principales.
No pulses botones ni envíes formularios.
```

## 9. Seguridad

- Ejecuta Chromium en modo `isolated`.
- Mantén `headless: true`.
- Mantén `codegen: "none"`.
- Bloquea `browser_run_code_unsafe`.
- No reutilices perfiles personales.
- No ignores errores TLS.
- No permitas acceso a redes privadas salvo petición explícita.
- Exige confirmación antes de acciones que modifiquen datos.
