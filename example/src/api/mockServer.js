/**
 * Simulated Remote HTTP Server.
 * Minimalist markdown-first task items matching the Obsidian Kanban format.
 */

const SEED_TASKS = [
  {
    id: 'task-1',
    content: '**Board description**\nAllow users to add a blerb of text at the top of the board',
    column: 'Backlog',
    completed: false
  },
  {
    id: 'task-2',
    content: '**Lane automation and triggers:**\n- Add card to lane when note is created in specific folder\n- Tag / untag cards based on lane\n- Move linked notes to new folder based on lane\n#automation',
    column: 'Backlog',
    completed: false
  },
  {
    id: 'task-3',
    content: '**Enhanced search / filtering**\n- [ ] Show # of results\n- [ ] Tag / page autocomplete\n- [ ] Filter views: use `display: none;` to hide filtered cards\n- [ ] Scroll to next / prev search result\n#search',
    column: 'Todo',
    completed: false
  },
  {
    id: 'task-4',
    content: 'Add option to move card to other lane\n\nAdd setting to choose the week starting day in the date picker',
    column: 'Todo',
    completed: false
  },
  {
    id: 'task-5',
    content: '`kanban-plugin: detailed`\n- [ ] Support multi line cards with full markdown support\nInstead of using unordered lists underneath an h2, we can use h3 + arbitrary markdown underneath h2\n- [ ] Figure out how to support linked page metadata, tags, etc',
    column: 'In Progress',
    completed: false
  },
  {
    id: 'task-6',
    content: 'Mobile support\n\nFix excalidraw embeds\n\nMinimal add a note button\n\nEnhanced markdown support',
    column: 'Done',
    completed: true
  }
];

let inMemoryTasks = [...SEED_TASKS];

export async function mockApiHandler(url, config) {
  await new Promise(resolve => setTimeout(resolve, 50));

  const urlObj = new URL(url, 'http://localhost');
  const pathname = urlObj.pathname;
  const method = config.method;

  if (method === 'GET' && pathname === '/api/tasks') {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      data: inMemoryTasks.map(t => ({ ...t })),
      headers: new Headers({ 'content-type': 'application/json' }),
      error: null
    };
  }

  if (method === 'POST' && pathname === '/api/tasks') {
    const payload = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const newTask = {
      id: `task-${Date.now()}`,
      content: payload.content || '',
      column: payload.column || 'Backlog',
      completed: Boolean(payload.completed),
      createdAt: new Date().toISOString()
    };
    inMemoryTasks.push(newTask);
    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      data: { ...newTask },
      headers: new Headers({ 'content-type': 'application/json' }),
      error: null
    };
  }

  const putMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (method === 'PUT' && putMatch) {
    const taskId = putMatch[1];
    const payload = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    const index = inMemoryTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      inMemoryTasks[index] = { ...inMemoryTasks[index], ...payload };
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        data: { ...inMemoryTasks[index] },
        headers: new Headers({ 'content-type': 'application/json' }),
        error: null
      };
    }
    return { ok: false, status: 404, statusText: 'Not Found', data: null, error: 'Not found' };
  }

  const deleteMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const taskId = deleteMatch[1];
    inMemoryTasks = inMemoryTasks.filter(t => t.id !== taskId);
    return { ok: true, status: 200, statusText: 'OK', data: { success: true }, error: null };
  }

  return undefined;
}
