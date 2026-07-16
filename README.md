# OpenClaw
Repositorio para todos los artefactos de OpenClaw

## Skills

### microsoft365

Integración con Microsoft 365 mediante Graph API. Permite interactuar con correo y calendario desde OpenClaw.

### peer-openclaw-admin

Skill portable para administrar de forma segura el otro nodo OpenClaw por SSH sobre Tailscale. Permite comprobar estado, diagnosticar problemas, consultar logs y ejecutar acciones de recuperación en el servidor remoto.

**Requisitos:**
- SSH y Bash disponibles en el sistema
- Linux como SO del nodo local
- Alias `openclaw-peer` configurado en `~/.ssh/config` apuntando al otro nodo

**Acciones disponibles:**

| Acción | Descripción | Confirmación |
|--------|-------------|:------------:|
| `status` | Estado general del nodo remoto (identidad, OpenClaw, canales, sistema, servicios) | No |
| `openclaw-status` | Estado detallado de OpenClaw y gateway | No |
| `doctor` | Diagnóstico completo con `openclaw doctor` | No |
| `security-audit` | Auditoría de seguridad profunda | No |
| `channels` | Estado de canales con sondeo | No |
| `gateway-logs` | Últimas 150 líneas del log del gateway | No |
| `gateway-restart` | Reinicia el gateway del nodo remoto | **Sí** |
| `update-dry-run` | Simula una actualización sin aplicarla | No |
| `update` | Actualiza OpenClaw en el nodo remoto | **Sí** |
| `reboot` | Reinicia el servidor remoto | **Sí** |

**Instalación:**

```bash
openclaw skills install ./peer-openclaw-admin --agent main
openclaw skills check --agent main
openclaw gateway restart
```

**Modelo de seguridad:**
- Solo ejecuta acciones predefinidas mediante el script `scripts/peer-openclaw-admin.sh`
- No construye comandos SSH arbitrarios a partir del texto del usuario
- Las acciones mutantes (`reboot`, `update`, `gateway-restart`) requieren confirmación explícita
- No expone claves privadas, tokens ni secretos

### openclaw-mcp-tooling

Centraliza herramientas e integraciones MCP utilizadas por OpenClaw. Proporciona la instalación de MCPorter como cliente MCP compartido y la integración con servidores MCP concretos.

**Estructura:**

```text
openclaw-mcp-tooling/
├── tools/
│   └── mcporter/          # Instalación y mantenimiento de MCPorter
├── integrations/
│   └── playwright-mcp/    # Automatización web con Playwright MCP
│       ├── examples/      # Configuraciones de ejemplo
│       └── skill/
│           └── browser-automation/  # Skill de OpenClaw
└── .gitignore
```

**Componentes:**

| Componente | Descripción |
|------------|-------------|
| **MCPorter** | Cliente y gestor común de servidores MCP. Dependencia compartida por cualquier skill que consuma herramientas MCP. |
| **Playwright MCP** | Integración de automatización web con Chromium headless aislado. Incluye la skill `browser-automation`. |

**Skill browser-automation** -- permite al agente navegar y automatizar paginas web:
- Navegar a URLs, inspeccionar snapshots, pulsar elementos, escribir texto
- Tomar capturas de pantalla
- Requiere confirmacion explicita antes de acciones mutantes (enviar formularios, iniciar sesion, pagos, etc.)
- Bloquea `browser_run_code_unsafe` por seguridad

**Requisitos:**
- Linux con Node.js, npm y npx
- MCPorter instalado globalmente (`npm install -g mcporter@0.12.3`)
- Chromium compatible instalado via Playwright

**Instalación rapida:**

```bash
# 1. Instalar MCPorter (ver tools/mcporter/README.md para detalle completo)
npm install -g mcporter@0.12.3

# 2. Configurar Playwright MCP (ver integrations/playwright-mcp/README.md)
mcporter list mcp-playwright --status --json --timeout 120000

# 3. Instalar la skill
cp integrations/playwright-mcp/skill/browser-automation/SKILL.md \
  "$HOME/skills/browser-automation/SKILL.md"
openclaw gateway restart
```

**Modelo de seguridad:**
- Chromium ejecuta en modo `isolated` y `headless`
- Generacion de codigo desactivada (`codegen: "none"`)
- Herramientas peligrosas bloqueadas via `blockedTools`
- No accede a redes privadas ni localhost sin peticion explicita
- Configuraciones con secretos excluidas del repositorio via `.gitignore`
