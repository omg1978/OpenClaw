# Microsoft 365 Skill – OpenClaw

Integración con Microsoft 365 (Email y Calendario) a través de Microsoft Graph API.

## Requisitos previos

- **Node.js** >= 18.0.0
- Una **Azure AD App Registration** con los permisos adecuados
- Credenciales de la aplicación (Client ID, Tenant ID, Client Secret)

## Configuración de Azure AD

1. Ve a [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Configura:
   - **Name**: OpenClaw Microsoft 365
   - **Supported account types**: Accounts in this organizational directory only (single tenant)
   - **Redirect URI**: Web → `http://localhost:8080/auth/microsoft/callback`
3. Una vez creada la app:
   - Copia el **Application (client) ID** → será tu `MS_CLIENT_ID`
   - Copia el **Directory (tenant) ID** → será tu `MS_TENANT_ID`
4. Ve a **Certificates & secrets** → **New client secret**:
   - Copia el **Value** → será tu `MS_CLIENT_SECRET`
5. Ve a **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**:
   - `User.Read`
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `offline_access`
6. Haz clic en **Grant admin consent** (si tienes permisos de administrador)

## Instalación

```bash
cd Skills/microsoft365
npm install
```

## Configuración

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
cp .env.example .env
```

Edita `.env`:

```env
MS_CLIENT_ID=tu-application-client-id
MS_TENANT_ID=tu-directory-tenant-id
MS_CLIENT_SECRET=tu-client-secret
MS_REDIRECT_URI=http://localhost:8080/auth/microsoft/callback
```

## Autenticación

Inicia el flujo OAuth2 (se abrirá el navegador):

```bash
npm run auth
```

Esto guardará los tokens de forma cifrada en `~/.openclaw/microsoft365-tokens.json`. Los tokens se refrescan automáticamente cuando expiran.

Para cerrar sesión:

```bash
npm start -- logout
```

## Uso

### Email

```bash
# Listar mensajes del inbox (últimos 10)
npm start -- email list

# Listar solo mensajes no leídos
npm start -- email list --unread

# Listar los últimos 25 mensajes
npm start -- email list --top 25

# Leer un email específico
npm start -- email read <message-id>

# Enviar un email
npm start -- email send --to "user@example.com" --subject "Hola" --body "Contenido del email"

# Enviar con CC
npm start -- email send --to "user@example.com" --subject "Hola" --body "Contenido" --cc "otro@example.com"

# Crear un borrador
npm start -- email draft --to "user@example.com" --subject "Borrador" --body "Contenido"

# Buscar emails
npm start -- email search "proyecto importante"

# Responder a un email
npm start -- email reply <message-id> --body "Gracias por tu mensaje"
```

### Calendario

```bash
# Ver eventos de hoy
npm start -- calendar today

# Ver eventos de la semana
npm start -- calendar week

# Ver detalles de un evento
npm start -- calendar show <event-id>

# Crear un evento
npm start -- calendar create \
  --subject "Reunión de equipo" \
  --start "2024-12-25T10:00:00" \
  --end "2024-12-25T11:00:00" \
  --location "Sala A" \
  --attendees "user1@example.com,user2@example.com" \
  --body "Agenda de la reunión"

# Consultar disponibilidad
npm start -- calendar availability \
  --start "2024-12-25T09:00:00" \
  --end "2024-12-25T18:00:00" \
  --attendees "user1@example.com,user2@example.com"
```

## Estructura del proyecto

```
Skills/microsoft365/
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración TypeScript
├── .env.example          # Variables de entorno de ejemplo
├── .gitignore            # Archivos a ignorar
├── README.md             # Esta documentación
└── src/
    ├── index.ts          # CLI principal (commander)
    ├── config.ts         # Carga de configuración
    ├── server.ts         # Servidor Express para callback OAuth
    ├── auth/
    │   ├── oauth.ts      # Flujo OAuth2 con MSAL
    │   └── tokenStore.ts # Almacenamiento cifrado de tokens
    └── graph/
        ├── client.ts     # Cliente base Microsoft Graph
        ├── email.ts      # Operaciones de email
        └── calendar.ts   # Operaciones de calendario
```

## Seguridad

- Los tokens se almacenan cifrados (AES-256-CBC) en `~/.openclaw/microsoft365-tokens.json`
- Nunca se almacenan credenciales en el código fuente
- El servidor OAuth temporal solo escucha durante el flujo de autenticación
- El `client_secret` solo existe en tu archivo `.env` local

## Solución de problemas

| Problema | Solución |
|---|---|
| `Missing required environment variable` | Asegúrate de que `.env` existe y tiene todas las variables |
| `No tokens found` | Ejecuta `npm run auth` para autenticarte |
| `Token refresh failed` | Vuelve a ejecutar `npm run auth` |
| `AADSTS700016` | Verifica que `MS_CLIENT_ID` es correcto |
| `AADSTS50011` | Verifica que el Redirect URI coincide en Azure AD y `.env` |
