import {
  ConfidentialClientApplication,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  Configuration,
} from "@azure/msal-node";
import { AppConfig, getConfig } from "../config";
import { TokenStore, StoredTokens } from "./tokenStore";
import { startCallbackServer } from "../server";
import open from "open";

export class OAuthManager {
  private msalClient: ConfidentialClientApplication;
  private config: AppConfig;
  private tokenStore: TokenStore;

  constructor() {
    this.config = getConfig();
    this.tokenStore = new TokenStore(this.config.tokenStorePath);

    const msalConfig: Configuration = {
      auth: {
        clientId: this.config.clientId,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        clientSecret: this.config.clientSecret,
      },
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  async authenticate(): Promise<StoredTokens> {
    const authCodeUrlParams: AuthorizationUrlRequest = {
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };

    const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParams);

    console.log("🔐 Starting Microsoft 365 authentication...");
    console.log("📋 Opening browser for authorization...\n");

    const authCode = await new Promise<string>((resolve, reject) => {
      const { server, codePromise } = startCallbackServer(
        this.config.redirectUri
      );

      open(authUrl).catch(() => {
        console.log("⚠️  Could not open browser automatically.");
        console.log(`   Please open this URL manually:\n   ${authUrl}\n`);
      });

      codePromise.then(resolve).catch(reject);

      setTimeout(() => {
        server.close();
        reject(new Error("Authentication timed out after 5 minutes."));
      }, 5 * 60 * 1000);
    });

    const tokenRequest: AuthorizationCodeRequest = {
      code: authCode,
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error("Failed to acquire token. No response from Azure AD.");
    }

    const tokens: StoredTokens = {
      accessToken: response.accessToken,
      refreshToken: (response as any).refreshToken || "",
      expiresAt: response.expiresOn
        ? response.expiresOn.getTime()
        : Date.now() + 3600 * 1000,
      account: response.account
        ? {
            homeAccountId: response.account.homeAccountId,
            environment: response.account.environment,
            username: response.account.username,
          }
        : undefined,
    };

    await this.tokenStore.save(tokens);
    console.log(`✅ Authentication successful! Logged in as: ${response.account?.username || "unknown"}`);
    console.log(`   Tokens saved to: ${this.config.tokenStorePath}`);

    return tokens;
  }

  async getAccessToken(): Promise<string> {
    const tokens = await this.tokenStore.load();

    if (!tokens) {
      throw new Error(
        "No tokens found. Please run 'npm run auth' first to authenticate."
      );
    }

    if (!this.tokenStore.isExpired(tokens)) {
      return tokens.accessToken;
    }

    console.log("🔄 Access token expired. Refreshing...");
    return this.refreshAccessToken(tokens);
  }

  private async refreshAccessToken(tokens: StoredTokens): Promise<string> {
    try {
      // Use MSAL's silent token acquisition with refresh token
      const refreshRequest = {
        refreshToken: tokens.refreshToken,
        scopes: this.config.scopes,
      };

      const response =
        await this.msalClient.acquireTokenByRefreshToken(refreshRequest);

      if (!response) {
        throw new Error("Token refresh returned no response.");
      }

      const newTokens: StoredTokens = {
        accessToken: response.accessToken,
        refreshToken: (response as any).refreshToken || tokens.refreshToken,
        expiresAt: response.expiresOn
          ? response.expiresOn.getTime()
          : Date.now() + 3600 * 1000,
        account: tokens.account,
      };

      await this.tokenStore.save(newTokens);
      console.log("✅ Token refreshed successfully.");
      return newTokens.accessToken;
    } catch (error: any) {
      await this.tokenStore.clear();
      throw new Error(
        `Token refresh failed: ${error.message}\nPlease re-authenticate with 'npm run auth'.`
      );
    }
  }

  async logout(): Promise<void> {
    await this.tokenStore.clear();
    console.log("👋 Logged out. Tokens cleared.");
  }
}
