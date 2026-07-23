import { google } from 'googleapis';
import { oauth2Client } from '../../services/googleAuth.js';
import { env } from '../../config/env.js';
import { addHours } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
function toLocalDateTimeString(date, time) {
    return `${date}T${time.length === 5 ? time + ':00' : time}`;
}
function addHoursToTimeString(date, time, hours) {
    const isoString = `${date}T${time.length === 5 ? time + ':00' : time}`;
    const result = addHours(new Date(isoString), hours);
    const pad = (n) => String(n).padStart(2, '0');
    return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(result.getHours())}:${pad(result.getMinutes())}:00`;
}
function inferDuration(title) {
    const t = title.toLowerCase();
    if (t.includes('dinner'))
        return 1.5;
    if (t.includes('class') || t.includes('lecture'))
        return 2;
    if (t.includes('lunch') || t.includes('meeting') || t.includes('workout'))
        return 1;
    return 1;
}
async function getConflictingEvents(date, startTime, endTime) {
    // Convert local time → UTC so the Google API query hits the correct slot
    const startISO = fromZonedTime(toLocalDateTimeString(date, startTime), env.TIMEZONE).toISOString();
    const endISO = fromZonedTime(toLocalDateTimeString(date, endTime), env.TIMEZONE).toISOString();
    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startISO,
        timeMax: endISO,
        timeZone: env.TIMEZONE,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return (res.data.items ?? []).map(e => ({
        id: e.id,
        title: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
    }));
}
// ─── calendar_create ─────────────────────────────────────────────────────────
export const calendarCreateTool = {
    definition: {
        name: 'calendar_create',
        description: 'Create a new event in Google Calendar. ' +
            'Unless force=true, this tool will first check for scheduling conflicts. ' +
            'If a conflict is found it returns the conflicting events so you can inform the user ' +
            'and ask whether to proceed, reschedule, or cancel the conflicting event.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Title of the event' },
                date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                startTime: { type: 'string', description: 'Start time in HH:mm (24-hour, local time)' },
                endTime: { type: 'string', description: 'End time in HH:mm (24-hour, local time). Optional — inferred from durationHours or event type.' },
                durationHours: { type: 'number', description: 'Duration in hours if endTime is not provided.' },
                location: { type: 'string', description: 'Location (optional)' },
                description: { type: 'string', description: 'Notes (optional)' },
                force: { type: 'boolean', description: 'Set to true to create the event even if conflicts exist. Only use after the user has confirmed.' },
            },
            required: ['title', 'date', 'startTime']
        }
    },
    execute: async (args) => {
        const { title, date, startTime, endTime, durationHours, location, description, force } = args;
        const computedEnd = endTime
            ? toLocalDateTimeString(date, endTime)
            : addHoursToTimeString(date, startTime, durationHours ?? inferDuration(title));
        const computedEndTime = endTime ?? computedEnd.substring(11, 16);
        // Conflict check
        if (!force) {
            const conflicts = await getConflictingEvents(date, startTime, computedEndTime);
            if (conflicts.length > 0) {
                return {
                    status: 'conflict',
                    message: 'There are existing events that overlap with this time slot.',
                    conflictingEvents: conflicts,
                    proposedEvent: { title, date, startTime, endTime: computedEndTime },
                };
            }
        }
        const start = toLocalDateTimeString(date, startTime);
        const res = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: title,
                location,
                description,
                start: { dateTime: start, timeZone: env.TIMEZONE },
                end: { dateTime: computedEnd, timeZone: env.TIMEZONE },
            },
        });
        return { status: 'success', eventId: res.data.id, link: res.data.htmlLink };
    }
};
// ─── calendar_list ────────────────────────────────────────────────────────────
export const calendarListTool = {
    definition: {
        name: 'calendar_list',
        description: 'List events from Google Calendar for a specific date. Returns event IDs needed for update/delete operations.',
        parameters: {
            type: 'object',
            properties: {
                date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
            },
            required: ['date']
        }
    },
    execute: async (args) => {
        const { date } = args;
        // Convert midnight-to-midnight in user's timezone → UTC for correct API range
        const timeMin = fromZonedTime(`${date}T00:00:00`, env.TIMEZONE).toISOString();
        const timeMax = fromZonedTime(`${date}T23:59:59`, env.TIMEZONE).toISOString();
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            timeZone: env.TIMEZONE,
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime',
        });
        const events = res.data.items ?? [];
        return events.map(e => ({
            id: e.id,
            title: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
        }));
    }
};
// ─── calendar_update ─────────────────────────────────────────────────────────
export const calendarUpdateTool = {
    definition: {
        name: 'calendar_update',
        description: 'Update an existing calendar event by its ID. ' +
            'Use this when the user wants to reschedule, shorten, extend, or rename an event. ' +
            'You must first call calendar_list to get the event ID. ' +
            'Only provide the fields you want to change — all others are preserved.',
        parameters: {
            type: 'object',
            properties: {
                eventId: { type: 'string', description: 'The Google Calendar event ID (from calendar_list)' },
                title: { type: 'string', description: 'New title (optional)' },
                date: { type: 'string', description: 'New date in YYYY-MM-DD format (optional)' },
                startTime: { type: 'string', description: 'New start time in HH:mm (optional)' },
                endTime: { type: 'string', description: 'New end time in HH:mm (optional)' },
                location: { type: 'string', description: 'New location (optional)' },
                description: { type: 'string', description: 'New description (optional)' },
            },
            required: ['eventId']
        }
    },
    execute: async (args) => {
        const { eventId, title, date, startTime, endTime, location, description } = args;
        // Fetch the existing event first to preserve unchanged fields
        const existing = await calendar.events.get({ calendarId: 'primary', eventId });
        const ev = existing.data;
        // Determine the date to use (new or existing)
        const effectiveDate = date
            ?? (ev.start?.dateTime ? ev.start.dateTime.substring(0, 10) : undefined);
        const effectiveStart = startTime
            ? toLocalDateTimeString(effectiveDate, startTime)
            : ev.start?.dateTime ?? ev.start?.date;
        const effectiveEnd = endTime
            ? toLocalDateTimeString(effectiveDate, endTime)
            : ev.end?.dateTime ?? ev.end?.date;
        const res = await calendar.events.update({
            calendarId: 'primary',
            eventId,
            requestBody: {
                ...ev,
                summary: title ?? ev.summary,
                location: location ?? ev.location,
                description: description ?? ev.description,
                start: { dateTime: effectiveStart, timeZone: env.TIMEZONE },
                end: { dateTime: effectiveEnd, timeZone: env.TIMEZONE },
            },
        });
        return { status: 'success', eventId: res.data.id, link: res.data.htmlLink };
    }
};
// ─── calendar_delete ─────────────────────────────────────────────────────────
export const calendarDeleteTool = {
    definition: {
        name: 'calendar_delete',
        description: 'Delete a calendar event by its ID. ' +
            'Use this when the user wants to cancel or remove an event. ' +
            'You must first call calendar_list to get the event ID. ' +
            'If multiple events match the user\'s description, list them and ask which one to delete.',
        parameters: {
            type: 'object',
            properties: {
                eventId: { type: 'string', description: 'The Google Calendar event ID (from calendar_list)' },
            },
            required: ['eventId']
        }
    },
    execute: async (args) => {
        const { eventId } = args;
        await calendar.events.delete({ calendarId: 'primary', eventId });
        return { status: 'success' };
    }
};
//# sourceMappingURL=index.js.map