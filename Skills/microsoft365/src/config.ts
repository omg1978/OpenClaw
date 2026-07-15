import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface AppConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  tokenStorePath: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`);
    console.error(`   Copy .env.example to .env and fill in your Azure AD credentials.`);
    process.exit(1);
  }
  return value;
}

export function getConfig(): AppConfig {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "~";

  return {
    clientId: requireEnv("MS_CLIENT_ID"),
    tenantId: requireEnv("MS_TENANT_ID"),
    clientSecret: requireEnv("MS_CLIENT_SECRET"),
    redirectUri:
      process.env.MS_REDIRECT_URI ||
      "http://localhost:8080/auth/microsoft/callback",
    scopes: [
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite",
      "Mail.Send",
      "Calendars.Read",
      "Calendars.ReadWrite",
      "offline_access",
    ],
    tokenStorePath: path.join(homeDir, ".openclaw", "microsoft365-tokens.json"),
  };
}
