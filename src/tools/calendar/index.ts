import { google } from 'googleapis';
import { oauth2Client } from '../../services/googleAuth.js';
import { Tool, ToolDefinition } from '../types.js';
import { addHours, parseISO } from 'date-fns';

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const calendarCreateTool: Tool = {
  definition: {
    name: 'calendar_create',
    description: 'Create a new event in Google Calendar',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the event' },
        date: { type: 'string', description: 'Date of the event in YYYY-MM-DD format' },
        startTime: { type: 'string', description: 'Start time of the event in HH:mm format' },
        endTime: { type: 'string', description: 'End time of the event in HH:mm format (optional)' },
        durationHours: { type: 'number', description: 'Duration in hours if endTime is not provided (optional, defaults to 1)' },
        location: { type: 'string', description: 'Location of the event (optional)' },
        description: { type: 'string', description: 'Description of the event (optional)' }
      },
      required: ['title', 'date', 'startTime']
    }
  },
  execute: async (args: any) => {
    const { title, date, startTime, endTime, durationHours, location, description } = args;
    const startDateTime = `${date}T${startTime}:00`;
    
    let endDateTime = '';
    if (endTime) {
      endDateTime = `${date}T${endTime}:00`;
    } else {
      const start = parseISO(startDateTime);
      const end = addHours(start, durationHours || 1);
      endDateTime = end.toISOString().slice(0, 19);
    }

    const event = {
      summary: title,
      location,
      description,
      start: {
        dateTime: parseISO(startDateTime).toISOString(),
        timeZone: 'UTC', // Ensure this is mapped correctly based on user timezone, ideally provided in config
      },
      end: {
        dateTime: parseISO(endDateTime).toISOString(),
        timeZone: 'UTC',
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    return { status: 'success', eventId: res.data.id, link: res.data.htmlLink };
  }
};

export const calendarListTool: Tool = {
  definition: {
    name: 'calendar_list',
    description: 'List events from Google Calendar for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to fetch events for in YYYY-MM-DD format' }
      },
      required: ['date']
    }
  },
  execute: async (args: any) => {
    const { date } = args;
    const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
    const timeMax = new Date(`${date}T23:59:59Z`).toISOString();

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = res.data.items || [];
    return events.map(e => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
    }));
  }
};
