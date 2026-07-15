#!/usr/bin/env node

import { Command } from "commander";
import { OAuthManager } from "./auth/oauth";
import { EmailService, formatMessageList, formatMessage } from "./graph/email";
import {
  CalendarService,
  formatEventList,
  formatEvent,
  formatAvailability,
} from "./graph/calendar";

const program = new Command();

program
  .name("ms365")
  .description("OpenClaw Microsoft 365 Skill – Interact with email and calendar via Microsoft Graph API")
  .version("1.0.0");

// ── Auth ─────────────────────────────────────────────────

program
  .command("auth")
  .description("Authenticate with Microsoft 365 via OAuth2")
  .action(async () => {
    try {
      const auth = new OAuthManager();
      await auth.authenticate();
    } catch (error: any) {
      console.error(`\n❌ Authentication failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("logout")
  .description("Clear stored tokens and log out")
  .action(async () => {
    try {
      const auth = new OAuthManager();
      await auth.logout();
    } catch (error: any) {
      console.error(`\n❌ Logout failed: ${error.message}`);
      process.exit(1);
    }
  });

// ── Email ────────────────────────────────────────────────

const email = program.command("email").description("Email operations");

email
  .command("list")
  .description("List inbox messages")
  .option("--unread", "Show only unread messages")
  .option("--top <number>", "Number of messages to show", "10")
  .action(async (opts) => {
    try {
      const svc = new EmailService();
      const top = parseInt(opts.top, 10);
      const messages = opts.unread
        ? await svc.getUnreadMessages(top)
        : await svc.getInboxMessages(top);
      console.log(`\n📬 ${opts.unread ? "Unread" : "Inbox"} messages (${messages.length}):\n`);
      console.log(formatMessageList(messages));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

email
  .command("read <id>")
  .description("Read a specific email by ID")
  .action(async (id: string) => {
    try {
      const svc = new EmailService();
      const msg = await svc.getMessage(id);
      console.log(formatMessage(msg));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

email
  .command("send")
  .description("Send an email")
  .requiredOption("--to <emails>", "Comma-separated recipient emails")
  .requiredOption("--subject <subject>", "Email subject")
  .requiredOption("--body <body>", "Email body")
  .option("--cc <emails>", "Comma-separated CC emails")
  .action(async (opts) => {
    try {
      const svc = new EmailService();
      const to = opts.to.split(",").map((e: string) => e.trim());
      const cc = opts.cc
        ? opts.cc.split(",").map((e: string) => e.trim())
        : undefined;
      await svc.sendEmail(to, opts.subject, opts.body, cc);
      console.log("✅ Email sent successfully!");
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

email
  .command("draft")
  .description("Create an email draft")
  .requiredOption("--to <emails>", "Comma-separated recipient emails")
  .requiredOption("--subject <subject>", "Email subject")
  .requiredOption("--body <body>", "Email body")
  .action(async (opts) => {
    try {
      const svc = new EmailService();
      const to = opts.to.split(",").map((e: string) => e.trim());
      const draft = await svc.createDraft(to, opts.subject, opts.body);
      console.log(`✅ Draft created! ID: ${draft.id}`);
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

email
  .command("search <query>")
  .description("Search emails")
  .action(async (query: string) => {
    try {
      const svc = new EmailService();
      const messages = await svc.searchEmails(query);
      console.log(`\n🔍 Search results for "${query}" (${messages.length}):\n`);
      console.log(formatMessageList(messages));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

email
  .command("reply <id>")
  .description("Reply to an email")
  .requiredOption("--body <body>", "Reply message")
  .action(async (id: string, opts: { body: string }) => {
    try {
      const svc = new EmailService();
      await svc.replyToEmail(id, opts.body);
      console.log("✅ Reply sent successfully!");
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

// ── Calendar ─────────────────────────────────────────────

const calendar = program.command("calendar").description("Calendar operations");

calendar
  .command("today")
  .description("Show today's events")
  .action(async () => {
    try {
      const svc = new CalendarService();
      const events = await svc.getTodayEvents();
      console.log(`\n📅 Today's events (${events.length}):\n`);
      console.log(formatEventList(events));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

calendar
  .command("week")
  .description("Show this week's events")
  .action(async () => {
    try {
      const svc = new CalendarService();
      const events = await svc.getWeekEvents();
      console.log(`\n📅 This week's events (${events.length}):\n`);
      console.log(formatEventList(events));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

calendar
  .command("show <id>")
  .description("Show event details")
  .action(async (id: string) => {
    try {
      const svc = new CalendarService();
      const event = await svc.getEvent(id);
      console.log(formatEvent(event));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

calendar
  .command("create")
  .description("Create a calendar event")
  .requiredOption("--subject <subject>", "Event subject")
  .requiredOption("--start <datetime>", "Start date/time (ISO 8601)")
  .requiredOption("--end <datetime>", "End date/time (ISO 8601)")
  .option("--attendees <emails>", "Comma-separated attendee emails")
  .option("--location <location>", "Event location")
  .option("--body <body>", "Event description")
  .action(async (opts) => {
    try {
      const svc = new CalendarService();
      const start = new Date(opts.start);
      const end = new Date(opts.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("❌ Invalid date format. Use ISO 8601 (e.g., 2024-12-25T10:00:00)");
        process.exit(1);
      }

      const attendees = opts.attendees
        ? opts.attendees.split(",").map((e: string) => e.trim())
        : undefined;

      const event = await svc.createEvent(
        opts.subject,
        start,
        end,
        attendees,
        opts.location,
        opts.body
      );
      console.log(`✅ Event created! ID: ${event.id}`);
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

calendar
  .command("availability")
  .description("Check availability for attendees")
  .requiredOption("--start <datetime>", "Start date/time (ISO 8601)")
  .requiredOption("--end <datetime>", "End date/time (ISO 8601)")
  .requiredOption("--attendees <emails>", "Comma-separated attendee emails")
  .action(async (opts) => {
    try {
      const svc = new CalendarService();
      const start = new Date(opts.start);
      const end = new Date(opts.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("❌ Invalid date format. Use ISO 8601 (e.g., 2024-12-25T10:00:00)");
        process.exit(1);
      }

      const attendees = opts.attendees.split(",").map((e: string) => e.trim());
      const schedules = await svc.findAvailability(start, end, attendees);
      console.log(`\n📊 Availability:\n`);
      console.log(formatAvailability(schedules));
    } catch (error: any) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
