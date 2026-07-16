import { Client } from "@microsoft/microsoft-graph-client";
import { OAuthManager } from "../auth/oauth";

export class GraphClient {
  private client: Client;
  private authManager: OAuthManager;

  constructor() {
    this.authManager = new OAuthManager();

    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.authManager.getAccessToken();
          done(null, token);
        } catch (error: any) {
          done(error, null);
        }
      },
    });
  }

  async get<T = any>(path: string, query?: Record<string, string>): Promise<T> {
    try {
      let request = this.client.api(path);
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          request = request.query({ [key]: value });
        }
      }
      return await request.get();
    } catch (error: any) {
      if (error.statusCode === 401) {
        return this.retryOnce(() => {
          let request = this.client.api(path);
          if (query) {
            for (const [key, value] of Object.entries(query)) {
              request = request.query({ [key]: value });
            }
          }
          return request.get();
        });
      }
      throw this.formatError(error);
    }
  }

  async post<T = any>(path: string, body: any): Promise<T> {
    try {
      return await this.client.api(path).post(body);
    } catch (error: any) {
      if (error.statusCode === 401) {
        return this.retryOnce(() => this.client.api(path).post(body));
      }
      throw this.formatError(error);
    }
  }

  async patch<T = any>(path: string, body: any): Promise<T> {
    try {
      return await this.client.api(path).patch(body);
    } catch (error: any) {
      if (error.statusCode === 401) {
        return this.retryOnce(() => this.client.api(path).patch(body));
      }
      throw this.formatError(error);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.client.api(path).delete();
    } catch (error: any) {
      if (error.statusCode === 401) {
        return this.retryOnce(() => this.client.api(path).delete());
      }
      throw this.formatError(error);
    }
  }

  /**
   * On 401, acquireTokenSilent will force-refresh the token via MSAL's
   * internal cache (which holds the refresh token). Retry the request once.
   */
  private async retryOnce<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  private formatError(error: any): Error {
    const message =
      error.body?.error?.message ||
      error.message ||
      "Unknown Microsoft Graph error";
    const code = error.statusCode || error.code || "UNKNOWN";
    return new Error(`Graph API error [${code}]: ${message}`);
  }
}
