import {
  ConfidentialClientApplication,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  Configuration,
  AccountInfo,
  InteractionRequiredAuthError,
  SilentFlowRequest,
} from "@azure/msal-node";
import { AppConfig, getConfig } from "../config";
import { TokenStore, StoredSession } from "./tokenStore";
import { startCallbackServer } from "../server";
import open from "open";

export class OAuthManager {
  private msalClient: ConfidentialClientApplication;
  private config: AppConfig;
  private tokenStore: TokenStore;
  private cacheRestored = false;

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

  /** Restore MSAL's in-memory cache from our encrypted store on disk. */
  private async restoreCache(): Promise<StoredSession | null> {
    if (this.cacheRestored) {
      return null;
    }
    this.cacheRestored = true;

    const session = await this.tokenStore.load();
    if (session) {
      this.msalClient
        .getTokenCache()
        .deserialize(session.msalCache);
    }
    return session;
  }

  /** Persist MSAL's in-memory cache (which contains refresh tokens) to disk. */
  private async persistCache(account: AccountInfo): Promise<void> {
    const msalCache = this.msalClient
      .getTokenCache()
      .serialize();

    await this.tokenStore.save({
      msalCache,
      account: {
        homeAccountId: account.homeAccountId,
        environment: account.environment,
        username: account.username,
      },
    });
  }

  async authenticate(): Promise<void> {
    const authCodeUrlParams: AuthorizationUrlRequest = {
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };

    const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParams);

    console.log("🔐 Starting Microsoft 365 authentication...");
    console.log("📋 Opening browser for authorization...\n");
    console.log(`🔗 Authorization URL:\n   ${authUrl}\n`);

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

    if (!response || !response.account) {
      throw new Error("Failed to acquire token. No response from Azure AD.");
    }

    // Persist the full MSAL cache (which now contains the refresh token internally)
    await this.persistCache(response.account);

    console.log(`✅ Authentication successful! Logged in as: ${response.account.username}`);
    console.log(`   Token cache saved to: ${this.config.tokenStorePath}`);
  }

  async getAccessToken(): Promise<string> {
    const session = await this.restoreCache();

    if (!session) {
      // restoreCache was already called previously or no session on disk
      const stored = await this.tokenStore.load();
      if (!stored) {
        throw new Error(
          "No tokens found. Please run 'npm run auth' first to authenticate."
        );
      }
      return this.acquireSilent(stored);
    }

    return this.acquireSilent(session);
  }

  private async acquireSilent(session: StoredSession): Promise<string> {
    // Reconstruct the AccountInfo from stored data so MSAL can look up the cache entry
    const account = await this.msalClient
      .getTokenCache()
      .getAccountByHomeId(session.account.homeAccountId);

    if (!account) {
      await this.tokenStore.clear();
      throw new Error(
        "Cached account not found in MSAL cache. Please re-authenticate with 'npm run auth'."
      );
    }

    const silentRequest: SilentFlowRequest = {
      account,
      scopes: this.config.scopes,
      forceRefresh: false,
    };

    try {
      // MSAL handles token reuse and automatic refresh internally
      const response = await this.msalClient.acquireTokenSilent(silentRequest);

      if (!response) {
        throw new Error("Silent token acquisition returned no response.");
      }

      // Persist updated cache (MSAL may have refreshed the tokens)
      await this.persistCache(account);

      return response.accessToken;
    } catch (error: any) {
      if (error instanceof InteractionRequiredAuthError) {
        await this.tokenStore.clear();
        throw new Error(
          `Interactive authentication required: ${error.message}\n` +
          `This can happen due to token revocation, MFA, or conditional access policies.\n` +
          `Please re-authenticate with 'npm run auth'.`
        );
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.tokenStore.clear();
    console.log("👋 Logged out. Token cache cleared.");
  }
}
