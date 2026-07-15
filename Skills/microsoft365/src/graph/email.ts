import { GraphClient } from "./client";

interface EmailAddress {
  emailAddress: {
    name?: string;
    address: string;
  };
}

interface GraphMessage {
  id: string;
  subject: string;
  from?: EmailAddress;
  toRecipients?: EmailAddress[];
  ccRecipients?: EmailAddress[];
  receivedDateTime: string;
  isRead: boolean;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  hasAttachments: boolean;
}

export class EmailService {
  private client: GraphClient;

  constructor() {
    this.client = new GraphClient();
  }

  async getInboxMessages(
    top: number = 10,
    filter?: string
  ): Promise<GraphMessage[]> {
    const query: Record<string, string> = {
      $top: top.toString(),
      $orderby: "receivedDateTime desc",
      $select:
        "id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,hasAttachments",
    };
    if (filter) {
      query.$filter = filter;
    }
    const response = await this.client.get<{ value: GraphMessage[] }>(
      "/me/messages",
      query
    );
    return response.value;
  }

  async getUnreadMessages(top: number = 10): Promise<GraphMessage[]> {
    return this.getInboxMessages(top, "isRead eq false");
  }

  async getMessage(messageId: string): Promise<GraphMessage> {
    return this.client.get<GraphMessage>(`/me/messages/${messageId}`, {
      $select:
        "id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,body,hasAttachments",
    });
  }

  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    cc?: string[]
  ): Promise<void> {
    const message: any = {
      message: {
        subject,
        body: {
          contentType: "Text",
          content: body,
        },
        toRecipients: to.map((addr) => ({
          emailAddress: { address: addr },
        })),
      },
      saveToSentItems: true,
    };

    if (cc && cc.length > 0) {
      message.message.ccRecipients = cc.map((addr) => ({
        emailAddress: { address: addr },
      }));
    }

    await this.client.post("/me/sendMail", message);
  }

  async createDraft(
    to: string[],
    subject: string,
    body: string
  ): Promise<GraphMessage> {
    const draft = {
      subject,
      body: {
        contentType: "Text",
        content: body,
      },
      toRecipients: to.map((addr) => ({
        emailAddress: { address: addr },
      })),
    };

    return this.client.post<GraphMessage>("/me/messages", draft);
  }

  async searchEmails(query: string): Promise<GraphMessage[]> {
    const response = await this.client.get<{ value: GraphMessage[] }>(
      "/me/messages",
      {
        $search: `"${query}"`,
        $top: "20",
        $select:
          "id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments",
      }
    );
    return response.value;
  }

  async replyToEmail(messageId: string, comment: string): Promise<void> {
    await this.client.post(`/me/messages/${messageId}/reply`, {
      comment,
    });
  }
}

// Formatting helpers for CLI output

export function formatMessageList(messages: GraphMessage[]): string {
  if (messages.length === 0) {
    return "📭 No messages found.";
  }

  return messages
    .map((msg) => {
      const read = msg.isRead ? " " : "🔵";
      const attach = msg.hasAttachments ? "📎" : "  ";
      const from = msg.from?.emailAddress?.address || "unknown";
      const date = new Date(msg.receivedDateTime).toLocaleString();
      return `${read} ${attach} ${date}\n   From: ${from}\n   Subject: ${msg.subject}\n   ID: ${msg.id}\n`;
    })
    .join("\n");
}

export function formatMessage(msg: GraphMessage): string {
  const from = msg.from?.emailAddress?.address || "unknown";
  const to =
    msg.toRecipients?.map((r) => r.emailAddress.address).join(", ") || "";
  const cc =
    msg.ccRecipients?.map((r) => r.emailAddress.address).join(", ") || "";
  const date = new Date(msg.receivedDateTime).toLocaleString();
  const body = msg.body?.content || msg.bodyPreview || "(no content)";

  let output = `\n📧 ${msg.subject}\n`;
  output += `${"─".repeat(60)}\n`;
  output += `From:    ${from}\n`;
  output += `To:      ${to}\n`;
  if (cc) output += `CC:      ${cc}\n`;
  output += `Date:    ${date}\n`;
  output += `Read:    ${msg.isRead ? "Yes" : "No"}\n`;
  output += `Attach:  ${msg.hasAttachments ? "Yes" : "No"}\n`;
  output += `${"─".repeat(60)}\n\n`;
  output += body;
  output += `\n`;

  return output;
}
