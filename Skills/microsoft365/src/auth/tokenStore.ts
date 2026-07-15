import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface StoredSession {
  /** Serialized MSAL token cache (contains access, refresh, id tokens internally) */
  msalCache: string;
  /** Account identifier needed by acquireTokenSilent */
  account: {
    homeAccountId: string;
    environment: string;
    username: string;
  };
}

// Derive an encryption key from the machine's hostname + user
function getEncryptionKey(): Buffer {
  const seed = `openclaw-ms365-${process.env.USERNAME || process.env.USER || "default"}-${require("os").hostname()}`;
  return crypto.createHash("sha256").update(seed).digest();
}

export class TokenStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async save(session: StoredSession): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    const json = JSON.stringify(session);
    let encrypted = cipher.update(json, "utf8", "hex");
    encrypted += cipher.final("hex");

    const payload = {
      iv: iv.toString("hex"),
      data: encrypted,
    };

    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), "utf8");
  }

  async load(): Promise<StoredSession | null> {
    if (!fs.existsSync(this.filePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const payload = JSON.parse(raw);

      const key = getEncryptionKey();
      const iv = Buffer.from(payload.iv, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

      let decrypted = decipher.update(payload.data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted) as StoredSession;
    } catch {
      console.warn("⚠️  Could not read token store. You may need to re-authenticate.");
      return null;
    }
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}
