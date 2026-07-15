# Microsoft 365 Skill – OpenClaw

Skill de integración con Microsoft 365 (Email y Calendario) a través de Microsoft Graph API para OpenClaw v2026.7.1.

## Índice

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Desarrollo](#desarrollo)
- [Configuración de Azure AD](#configuración-de-azure-ad)
- [Despliegue](#despliegue)
- [Autenticación](#autenticación)
- [Uso](#uso)
- [Seguridad](#seguridad)
- [Solución de problemas](#solución-de-problemas)
- [Historial de decisiones](#historial-de-decisiones)

## Descripción

Este skill permite a OpenClaw interactuar con Microsoft 365 mediante Microsoft Graph API v1.0 para:
- **Email**: Leer inbox, emails no leídos, enviar, crear borradores, buscar y responder
- **Calendario**: Ver eventos del día/semana, crear eventos, consultar disponibilidad

## Arquitectura

```
Skills/microsoft365/
├── package.json          # Dependencias y scripts npm
├── tsconfig.json         # Configuración TypeScript
├── .env.example          # Template de variables de entorno
├── .gitignore            # Excluye node_modules, .env, tokens
├── SKILL.md              # Descriptor para OpenClaw (acciones permitidas)
├── README.md             # Esta documentación
└── src/
    ├── index.ts          # CLI principal con Commander.js (13 comandos)
    ├── config.ts         # Carga y validación de configuración desde .env
    ├── server.ts         # Servidor Express temporal para OAuth callback
    ├── auth/
    │   ├── oauth.ts      # Flujo OAuth2 Authorization Code con MSAL
    │   └── tokenStore.ts # Almacenamiento cifrado de tokens (AES-256-CBC)
    └── graph/
        ├── client.ts     # Cliente base Microsoft Graph con auto-retry 401
        ├── email.ts      # 7 operaciones de email
        └── calendar.ts   # 5 operaciones de calendario
```

### Flujo de autenticación

```
[Usuario] → npm run auth → [Servidor Express local :18790]
                                    ↓
[Navegador] → login.microsoftonline.com → [Autoriza permisos]
                                    ↓
[Microsoft] → redirect a localhost:18790/auth/microsoft/callback?code=XXX
                                    ↓
[oauth.ts] → POST /oauth2/v2.0/token (code + client_secret) → access_token + refresh_token
                                    ↓
[tokenStore.ts] → cifra y guarda en ~/.openclaw/microsoft365-tokens.json
```

### Flujo de llamadas a Graph API

```
[Comando CLI] → GraphClient → authProvider (lee token) → Graph API
                      ↓ (si 401)
              refresh token → nuevo access_token → retry
```

## Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.x
- Cuenta de **Microsoft 365** (personal o empresarial)
- **Azure AD App Registration** configurada
- Acceso SSH al servidor OpenClaw (para despliegue)

## Desarrollo

### Stack tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | 5.7+ |
| Runtime | Node.js | 18+ |
| OAuth | @azure/msal-node | 2.16+ |
| Graph SDK | @microsoft/microsoft-graph-client | 3.0+ |
| CLI | Commander.js | 12.x |
| HTTP Server | Express | 4.x |
| Variables env | dotenv | 16.x |

### Configuración local (desarrollo)

```bash
cd Skills/microsoft365
npm install
cp .env.example .env
# Editar .env con credenciales de Azure AD
npm run auth    # Autenticarse
npm start -- email list   # Probar
```

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run build` | Compila TypeScript a JavaScript (dist/) |
| `npm run auth` | Inicia flujo OAuth2 interactivo |
| `npm start -- [cmd]` | Ejecuta un comando del CLI |
| `npm run dev` | Modo watch para desarrollo |

## Configuración de Azure AD

### Paso 1: Registrar aplicación

1. Ir a [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Configurar:
   - **Name**: `OpenClaw Microsoft 365 Integration`
   - **Supported account types**: `Accounts in this organizational directory only` (single tenant)
   - **Redirect URI**: Platform `Web` → `http://localhost:18790/auth/microsoft/callback`
3. Anotar:
   - **Application (client) ID** → `MS_CLIENT_ID`
   - **Directory (tenant) ID** → `MS_TENANT_ID`

### Paso 2: Crear secreto de cliente

1. **Certificates & secrets** → **New client secret**
2. Descripción: `OpenClaw Production`
3. Expiración: 24 meses
4. ⚠️ Copiar el **Value** inmediatamente → `MS_CLIENT_SECRET`

### Paso 3: Configurar permisos de API

1. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
2. Añadir:
   - `User.Read`
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `offline_access`
3. (Opcional) **Grant admin consent** si eres administrador del tenant

### Paso 4: Configurar autenticación

1. **Authentication** → Verificar que el redirect URI está correcto
2. **Implicit grant and hybrid flows**:
   - ❌ Access tokens: **desmarcado**
   - ❌ ID tokens: **desmarcado**
   - (Usamos Authorization Code flow puro, más seguro para backend)

### Decisión: Authorization Code Flow vs Implicit

Se eligió **Authorization Code Flow** porque:
- El secreto de cliente nunca se expone al navegador
- Soporta refresh tokens (mantiene acceso sin re-login)
- Es el flujo recomendado por Microsoft para aplicaciones con backend
- Implicit flow está deprecado para nuevas aplicaciones

## Despliegue

### Entorno destino

- **Máquina**: Linux (Debian, hostname: firebat)
- **OpenClaw**: v2026.7.1
- **Ruta del skill**: `~/skills/microsoft365/`
- **Acceso**: Solo SSH (sin entorno gráfico)

### Pasos de despliegue

#### 1. Comprimir el skill (desde Windows/máquina de desarrollo)

```powershell
cd Skills/microsoft365
tar -czf "$env:TEMP\microsoft365-skill.tar.gz" --exclude=node_modules *
```

#### 2. Transferir al servidor

```powershell
scp -i "$env:USERPROFILE\.ssh\openclaw_firebat" -o IdentitiesOnly=yes "$env:TEMP\microsoft365-skill.tar.gz" oscar@openclaw-firebat:/home/oscar/microsoft365-skill.tar.gz
```

#### 3. Instalar en el servidor

```bash
mkdir -p ~/skills/microsoft365
cd ~/skills/microsoft365
tar -xzf ~/microsoft365-skill.tar.gz
npm install
rm ~/microsoft365-skill.tar.gz
```

#### 4. Configurar credenciales

```bash
cp .env.example .env
nano .env
# Rellenar: MS_CLIENT_ID, MS_TENANT_ID, MS_CLIENT_SECRET, MS_REDIRECT_URI
```

#### 5. Autenticar (requiere túnel SSH)

Como el servidor no tiene navegador, se usa un túnel SSH:

```powershell
# Desde Windows (terminal separada):
ssh -i "$env:USERPROFILE\.ssh\openclaw_firebat" -o IdentitiesOnly=yes -L 18790:localhost:18790 oscar@openclaw-firebat
```

```bash
# En el servidor:
cd ~/skills/microsoft365
npm run auth
# Copiar la URL que aparece y abrirla en navegador local (Windows)
# Microsoft redirige al callback → llega al servidor via túnel SSH
```

#### 6. Verificar

```bash
npm start -- email list       # Debe mostrar emails
npm start -- calendar today   # Debe mostrar eventos
```

### Estructura en el servidor

```
~/skills/microsoft365/       # Código del skill
~/.openclaw/microsoft365-tokens.json  # Tokens cifrados (generado automáticamente)
```

### ⚠️ Notas importantes sobre el despliegue

- El puerto 18789 está ocupado por el gateway de OpenClaw → se usa 18790 para el callback OAuth
- El túnel SSH solo es necesario para la autenticación inicial y cuando expiren los tokens
- Los tokens se refrescan automáticamente (1h access, ~90 días refresh)
- El `SKILL.md` en `~/skills/microsoft365/` es detectado automáticamente por OpenClaw

## Autenticación

### Autenticación inicial

```bash
cd ~/skills/microsoft365
npm run auth
```

### Re-autenticación (si refresh token expira)

```bash
# 1. Abrir túnel SSH desde Windows
ssh -L 18790:localhost:18790 oscar@openclaw-firebat

# 2. En el servidor
cd ~/skills/microsoft365
npm run auth
# 3. Abrir URL en navegador Windows
```

### Logout

```bash
npm start -- logout
# Elimina tokens almacenados
```

### Almacenamiento de tokens

- Ubicación: `~/.openclaw/microsoft365-tokens.json`
- Cifrado: AES-256-CBC
- Clave derivada de: hostname + username (no portable entre máquinas)
- Auto-refresh: 5 minutos antes de expiración

## Uso

### Email

```bash
# Listar últimos 10 mensajes
npm start -- email list

# Solo no leídos
npm start -- email list --unread

# Más mensajes
npm start -- email list --top 25

# Leer un email específico
npm start -- email read <message-id>

# Enviar email
npm start -- email send --to "user@example.com" --subject "Asunto" --body "Contenido"

# Enviar con CC
npm start -- email send --to "user@example.com" --subject "Asunto" --body "Texto" --cc "otro@example.com"

# Crear borrador
npm start -- email draft --to "user@example.com" --subject "Borrador" --body "Contenido"

# Buscar emails
npm start -- email search "término"

# Responder a un email
npm start -- email reply <message-id> --body "Respuesta"
```

### Calendario

```bash
# Eventos de hoy
npm start -- calendar today

# Eventos de la semana
npm start -- calendar week

# Detalles de un evento
npm start -- calendar show <event-id>

# Crear evento
npm start -- calendar create \
  --subject "Reunión" \
  --start "2026-07-20T10:00:00" \
  --end "2026-07-20T11:00:00" \
  --location "Sala A" \
  --attendees "user1@example.com,user2@example.com" \
  --body "Agenda de la reunión"

# Consultar disponibilidad
npm start -- calendar availability \
  --start "2026-07-20T09:00:00" \
  --end "2026-07-20T18:00:00" \
  --attendees "user1@example.com,user2@example.com"
```

### Uso desde OpenClaw (lenguaje natural)

Una vez desplegado, puedes hablar con OpenClaw:
- "¿Qué emails tengo sin leer?"
- "¿Qué reuniones tengo hoy?"
- "Envía un email a juan@empresa.com preguntándole por el presupuesto"
- "Crea una reunión el viernes a las 10 con María"
- "¿Está libre Pedro mañana por la tarde?"

## Seguridad

| Aspecto | Implementación |
|---|---|
| Tokens en disco | Cifrados con AES-256-CBC |
| Client Secret | Solo en `.env` (no en Git) |
| Flujo OAuth | Authorization Code (secreto nunca expuesto al navegador) |
| Permisos | Solo delegados (contexto del usuario, no admin) |
| Refresh | Automático, sin intervención |
| `.gitignore` | Excluye `.env`, `node_modules`, tokens |

### Qué NO se almacena en el repositorio

- ❌ Client Secret
- ❌ Tokens de acceso/refresh
- ❌ Archivos `.env` con credenciales
- ❌ `node_modules`

## Solución de problemas

| Error | Causa | Solución |
|---|---|---|
| `Missing required environment variable` | `.env` incompleto | Verificar todas las variables en `.env` |
| `EADDRINUSE: address already in use` | Puerto del callback ocupado | Cambiar `MS_REDIRECT_URI` a otro puerto |
| `No tokens found` | No autenticado | Ejecutar `npm run auth` |
| `Token refresh failed` | Refresh token expirado | Ejecutar `npm run auth` de nuevo |
| `AADSTS700016` | Client ID incorrecto | Verificar `MS_CLIENT_ID` en Azure Portal |
| `AADSTS50011` | Redirect URI no coincide | Verificar URI en Azure AD y en `.env` |
| `AADSTS65001` | Permisos no consentidos | Ir a Azure → API permissions → Grant consent |
| `Cannot GET /auth/microsoft/` | URL incorrecta | No abrir esa ruta; usar la URL de Microsoft que muestra el CLI |
| `Graph API error [401]` | Token expirado y refresh falló | Ejecutar `npm run auth` |

## Historial de decisiones

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-07-15 | TypeScript sobre Python | Ecosistema MS Graph SDK más maduro en Node.js; OpenClaw usa npm |
| 2026-07-15 | Authorization Code Flow | Más seguro que Implicit; soporta refresh tokens |
| 2026-07-15 | Puerto 18790 para callback | Puerto 18789 ocupado por gateway de OpenClaw |
| 2026-07-15 | Tokens cifrados AES-256-CBC | Protege tokens en disco; clave derivada de hostname+user |
| 2026-07-15 | Solo permisos delegados | Mínimo privilegio; no se necesita acceso admin |
| 2026-07-15 | `offline_access` obligatorio | Permite refresh tokens sin re-login |
| 2026-07-15 | URL siempre visible en CLI | Necesario para autenticación headless (SSH) |
| 2026-07-15 | Skill en ~/skills/ | Evita que actualizaciones de OpenClaw lo sobrescriban |
