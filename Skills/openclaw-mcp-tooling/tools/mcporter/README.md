# MCPorter para OpenClaw

MCPorter actúa como cliente y gestor común de servidores MCP para OpenClaw.

Esta instalación no pertenece a una skill concreta. Es una dependencia compartida por cualquier skill que necesite consumir herramientas mediante Model Context Protocol.

## 1. Requisitos

Comprueba Node.js, npm y npx:

```bash
node --version
npm --version
npx --version
```

## 2. Configurar instalación npm para el usuario

Evita instalar paquetes globales de npm con `sudo`.

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
```

Añade el directorio al `PATH`:

```bash
grep -qxF 'export PATH="$HOME/.npm-global/bin:$PATH"' "$HOME/.bashrc" || \
  echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.bashrc"

export PATH="$HOME/.npm-global/bin:$PATH"
```

## 3. Instalar MCPorter

Versión validada:

```bash
npm install -g mcporter@0.12.3
```

Comprueba:

```bash
command -v mcporter
mcporter --version
```

Resultado esperado:

```text
/home/USUARIO/.npm-global/bin/mcporter
0.12.3
```

## 4. Crear un wrapper estable para OpenClaw

En algunas instalaciones OpenClaw detecta de forma más fiable los binarios ubicados en `~/.local/bin`.

```bash
mkdir -p "$HOME/.local/bin"

cat > "$HOME/.local/bin/mcporter" <<EOF
#!/usr/bin/env bash
exec "$HOME/.npm-global/bin/mcporter" "\$@"
EOF

chmod 755 "$HOME/.local/bin/mcporter"
```

Comprueba:

```bash
command -v mcporter
mcporter --version
```

La ruta esperada pasa a ser:

```text
/home/USUARIO/.local/bin/mcporter
```

## 5. Crear el directorio de configuración

```bash
mkdir -p "$HOME/.mcporter"
chmod 700 "$HOME/.mcporter"
```

El archivo principal será:

```text
~/.mcporter/mcporter.json
```

Debe protegerse con:

```bash
chmod 600 "$HOME/.mcporter/mcporter.json"
```

## 6. Comprobar el PATH del gateway OpenClaw

```bash
systemctl --user show openclaw-gateway \
  --property=Environment \
  --no-pager |
  tr ' ' '\n' |
  grep '^PATH='
```

Debe incluir, como mínimo:

```text
/home/USUARIO/.local/bin
/home/USUARIO/.npm-global/bin
```

## 7. Validación desde OpenClaw

Una skill que declare:

```yaml
metadata: {"openclaw":{"requires":{"bins":["mcporter"]},"os":["linux"]}}
```

debe aparecer como disponible:

```bash
openclaw skills check --agent main
```

## 8. Operaciones habituales

Listar servidores configurados:

```bash
mcporter list --verbose
```

Comprobar un servidor:

```bash
mcporter list NOMBRE_SERVIDOR --status --json --timeout 120000
```

Invocar una herramienta:

```bash
mcporter call \
  'NOMBRE_SERVIDOR.NOMBRE_HERRAMIENTA(parametro: "valor")' \
  --timeout 120000
```

## 9. Actualización controlada

Antes de actualizar:

```bash
mcporter --version
npm view mcporter version
```

Actualiza fijando una versión concreta:

```bash
npm install -g mcporter@VERSION
```

Después:

```bash
mcporter --version
mcporter list --verbose
```

## 10. Seguridad

- No expongas MCPorter como servicio de red.
- Mantén `~/.mcporter` con permisos `700`.
- Mantén `mcporter.json` con permisos `600`.
- No subas configuraciones reales con secretos al repositorio.
- Bloquea herramientas peligrosas mediante `blockedTools`.
- Fija versiones de servidores MCP y revisa cambios antes de actualizar.
- No permitas que contenido remoto construya comandos de shell.
