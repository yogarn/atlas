import { google } from 'googleapis';
import { oauth2Client } from '../../services/googleAuth.js';
import { Tool, ToolDefinition } from '../types.js';

const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

export const tasksCreateTool: Tool = {
  definition: {
    name: 'tasks_create',
    description: 'Create a new task in Google Tasks',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        notes: { type: 'string', description: 'Description or notes for the task (optional)' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format (optional)' }
      },
      required: ['title']
    }
  },
  execute: async (args: any) => {
    const { title, notes, dueDate } = args;

    const requestBody: any = {
      title,
      notes,
    };

    if (dueDate) {
      requestBody.due = new Date(`${dueDate}T00:00:00Z`).toISOString();
    }

    const res = await tasks.tasks.insert({
      tasklist: '@default',
      requestBody,
    });
    
    return { status: 'success', taskId: res.data.id, title: res.data.title };
  }
};

export const tasksListTool: Tool = {
  definition: {
    name: 'tasks_list',
    description: 'List pending tasks from Google Tasks',
    parameters: {
      type: 'object',
      properties: {
        maxResults: { type: 'number', description: 'Maximum number of tasks to return (default 10)' }
      },
      required: []
    }
  },
  execute: async (args: any) => {
    const res = await tasks.tasks.list({
      tasklist: '@default',
      maxResults: args.maxResults || 10,
      showCompleted: false,
    });
    
    const items = res.data.items || [];
    return items.map(t => ({
      id: t.id,
      title: t.title,
      due: t.due,
    }));
  }
};
