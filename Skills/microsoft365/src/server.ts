import express from "express";
import { Server } from "http";

interface CallbackServerResult {
  server: Server;
  codePromise: Promise<string>;
}

export function startCallbackServer(redirectUri: string): CallbackServerResult {
  const app = express();
  const url = new URL(redirectUri);
  const port = parseInt(url.port, 10) || 8080;
  const callbackPath = url.pathname;

  let resolveCode: (code: string) => void;
  let rejectCode: (error: Error) => void;

  const codePromise = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  app.get(callbackPath, (req, res) => {
    const code = req.query.code as string | undefined;
    const error = req.query.error as string | undefined;
    const errorDescription = req.query.error_description as string | undefined;

    if (error) {
      res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>❌ Authentication Failed</h2>
          <p>${errorDescription || error}</p>
          <p>You can close this window.</p>
        </body></html>
      `);
      server.close();
      rejectCode(new Error(`OAuth error: ${errorDescription || error}`));
      return;
    }

    if (!code) {
      res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>❌ No authorization code received</h2>
          <p>You can close this window.</p>
        </body></html>
      `);
      server.close();
      rejectCode(new Error("No authorization code received in callback."));
      return;
    }

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:50px">
        <h2>✅ Authentication Successful!</h2>
        <p>You can close this window and return to the terminal.</p>
      </body></html>
    `);

    server.close();
    resolveCode(code);
  });

  const server = app.listen(port, () => {
    console.log(`🌐 Callback server listening on http://localhost:${port}${callbackPath}`);
  });

  return { server, codePromise };
}
