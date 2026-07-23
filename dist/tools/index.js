import { toolRegistry } from './registry.js';
import { calendarCreateTool, calendarListTool, calendarUpdateTool, calendarDeleteTool } from './calendar/index.js';
import { tasksCreateTool, tasksListTool, tasksUpdateTool, tasksDeleteTool } from './tasks/index.js';
import { weatherTodayTool } from './weather/index.js';
toolRegistry.register(calendarCreateTool);
toolRegistry.register(calendarListTool);
toolRegistry.register(calendarUpdateTool);
toolRegistry.register(calendarDeleteTool);
toolRegistry.register(tasksCreateTool);
toolRegistry.register(tasksListTool);
toolRegistry.register(tasksUpdateTool);
toolRegistry.register(tasksDeleteTool);
toolRegistry.register(weatherTodayTool);
export { toolRegistry };
//# sourceMappingURL=index.js.map