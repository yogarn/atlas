import { google } from 'googleapis';
import { oauth2Client } from '../../services/googleAuth.js';
const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
export const tasksCreateTool = {
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
    execute: async (args) => {
        const { title, notes, dueDate } = args;
        const requestBody = {
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
export const tasksListTool = {
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
    execute: async (args) => {
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
            notes: t.notes,
        }));
    }
};
export const tasksUpdateTool = {
    definition: {
        name: 'tasks_update',
        description: 'Update an existing task by its ID. You must first call tasks_list to get the task ID. Only provide fields you want to change.',
        parameters: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'The Google Task ID (from tasks_list)' },
                title: { type: 'string', description: 'New title (optional)' },
                notes: { type: 'string', description: 'New notes (optional)' },
                dueDate: { type: 'string', description: 'New due date in YYYY-MM-DD format (optional)' },
                status: { type: 'string', description: 'Status of task, "needsAction" or "completed" (optional)' }
            },
            required: ['taskId']
        }
    },
    execute: async (args) => {
        const { taskId, title, notes, dueDate, status } = args;
        const existing = await tasks.tasks.get({ tasklist: '@default', task: taskId });
        const task = existing.data;
        const requestBody = {
            ...task,
            title: title ?? task.title,
            notes: notes ?? task.notes,
            status: status ?? task.status,
        };
        if (dueDate) {
            requestBody.due = new Date(`${dueDate}T00:00:00Z`).toISOString();
        }
        const res = await tasks.tasks.update({
            tasklist: '@default',
            task: taskId,
            requestBody,
        });
        return { status: 'success', taskId: res.data.id, title: res.data.title, taskStatus: res.data.status };
    }
};
export const tasksDeleteTool = {
    definition: {
        name: 'tasks_delete',
        description: 'Delete a task by its ID. You must first call tasks_list to get the task ID.',
        parameters: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'The Google Task ID (from tasks_list)' }
            },
            required: ['taskId']
        }
    },
    execute: async (args) => {
        const { taskId } = args;
        await tasks.tasks.delete({ tasklist: '@default', task: taskId });
        return { status: 'success' };
    }
};
//# sourceMappingURL=index.js.map