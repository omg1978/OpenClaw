import { GraphClient } from "./client";

interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer?: { emailAddress: { name?: string; address: string } };
  attendees?: Array<{
    emailAddress: { name?: string; address: string };
    status: { response: string };
  }>;
  isAllDay: boolean;
  bodyPreview?: string;
  body?: { contentType: string; content: string };
  webLink?: string;
}

interface ScheduleInfo {
  scheduleId: string;
  availabilityView: string;
  scheduleItems: Array<{
    status: string;
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }>;
}

export class CalendarService {
  private client: GraphClient;

  constructor() {
    this.client = new GraphClient();
  }

  async getTodayEvents(): Promise<GraphEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.getCalendarView(startOfDay, endOfDay);
  }

  async getWeekEvents(): Promise<GraphEvent[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.getCalendarView(startOfWeek, endOfWeek);
  }

  private async getCalendarView(
    start: Date,
    end: Date
  ): Promise<GraphEvent[]> {
    const response = await this.client.get<{ value: GraphEvent[] }>(
      "/me/calendarView",
      {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        $orderby: "start/dateTime",
        $select:
          "id,subject,start,end,location,organizer,attendees,isAllDay,bodyPreview,webLink",
        $top: "50",
      }
    );
    return response.value;
  }

  async getEvent(eventId: string): Promise<GraphEvent> {
    return this.client.get<GraphEvent>(`/me/events/${eventId}`, {
      $select:
        "id,subject,start,end,location,organizer,attendees,isAllDay,body,webLink",
    });
  }

  async createEvent(
    subject: string,
    start: Date,
    end: Date,
    attendees?: string[],
    location?: string,
    body?: string
  ): Promise<GraphEvent> {
    const event: any = {
      subject,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map((email) => ({
        emailAddress: { address: email },
        type: "required",
      }));
    }

    if (location) {
      event.location = { displayName: location };
    }

    if (body) {
      event.body = { contentType: "Text", content: body };
    }

    return this.client.post<GraphEvent>("/me/events", event);
  }

  async findAvailability(
    start: Date,
    end: Date,
    attendees: string[]
  ): Promise<ScheduleInfo[]> {
    const request = {
      schedules: attendees,
      startTime: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      endTime: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      availabilityViewInterval: 30,
    };

    const response = await this.client.post<{ value: ScheduleInfo[] }>(
      "/me/calendar/getSchedule",
      request
    );
    return response.value;
  }
}

// Formatting helpers for CLI output

export function formatEventList(events: GraphEvent[]): string {
  if (events.length === 0) {
    return "📅 No events found.";
  }

  return events
    .map((evt) => {
      const start = new Date(evt.start.dateTime).toLocaleString();
      const end = new Date(evt.end.dateTime).toLocaleTimeString();
      const loc = evt.location?.displayName ? ` 📍 ${evt.location.displayName}` : "";
      const allDay = evt.isAllDay ? " (All day)" : "";
      return `📅 ${start} – ${end}${allDay}${loc}\n   ${evt.subject}\n   ID: ${evt.id}\n`;
    })
    .join("\n");
}

export function formatEvent(evt: GraphEvent): string {
  const start = new Date(evt.start.dateTime).toLocaleString();
  const end = new Date(evt.end.dateTime).toLocaleString();
  const loc = evt.location?.displayName || "Not specified";
  const organizer = evt.organizer?.emailAddress?.address || "unknown";
  const body = evt.body?.content || evt.bodyPreview || "(no description)";

  let output = `\n📅 ${evt.subject}\n`;
  output += `${"─".repeat(60)}\n`;
  output += `Start:     ${start}\n`;
  output += `End:       ${end}\n`;
  output += `All day:   ${evt.isAllDay ? "Yes" : "No"}\n`;
  output += `Location:  ${loc}\n`;
  output += `Organizer: ${organizer}\n`;

  if (evt.attendees && evt.attendees.length > 0) {
    output += `Attendees:\n`;
    for (const att of evt.attendees) {
      const status = att.status.response || "unknown";
      output += `  - ${att.emailAddress.address} (${status})\n`;
    }
  }

  if (evt.webLink) {
    output += `Link:      ${evt.webLink}\n`;
  }

  output += `${"─".repeat(60)}\n\n`;
  output += body;
  output += `\n`;

  return output;
}

export function formatAvailability(schedules: ScheduleInfo[]): string {
  if (schedules.length === 0) {
    return "No schedule information available.";
  }

  return schedules
    .map((sched) => {
      let output = `\n👤 ${sched.scheduleId}\n`;
      output += `   Availability: ${sched.availabilityView}\n`;
      output += `   Legend: 0=Free, 1=Tentative, 2=Busy, 3=OOF, 4=Working elsewhere\n`;

      if (sched.scheduleItems.length > 0) {
        output += `   Busy slots:\n`;
        for (const item of sched.scheduleItems) {
          const start = new Date(item.start.dateTime).toLocaleString();
          const end = new Date(item.end.dateTime).toLocaleTimeString();
          output += `     - ${start} – ${end} [${item.status}] ${item.subject || ""}\n`;
        }
      }

      return output;
    })
    .join("\n");
}
