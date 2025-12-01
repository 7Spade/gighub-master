import { MockRequest } from '@delon/mock';

// region: mock data

const statuses = ['open', 'in_progress', 'done', 'cancelled'];
const priorities = ['low', 'normal', 'high', 'urgent'];
const assignees = [
  { id: 'user-1', name: '張三' },
  { id: 'user-2', name: '李四' },
  { id: 'user-3', name: '王五' },
  { id: 'user-4', name: '趙六' },
  { id: 'user-5', name: '陳七' }
];
const tags = ['緊急', '文件', '施工', '安全', '驗收', '材料', '設計', '協調'];

function generateTodos(count = 50): any[] {
  const todos: any[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const createdDate = new Date(today);
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    const hasDueDate = Math.random() > 0.3;
    let dueDate: Date | undefined;
    if (hasDueDate) {
      dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) - 3); // -3 to +11 days
    }

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const completedDate = status === 'done' ? new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined;

    const assignee = Math.random() > 0.2 ? assignees[Math.floor(Math.random() * assignees.length)] : null;
    const creator = assignees[Math.floor(Math.random() * assignees.length)];

    const todoTags: string[] = [];
    const tagCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      if (!todoTags.includes(tag)) {
        todoTags.push(tag);
      }
    }

    todos.push({
      id: `todo-${i + 1}`,
      workspaceId: 'workspace-1',
      blueprintId: i % 3 === 0 ? 'blueprint-1' : undefined,
      title: getTodoTitle(i),
      description: i % 2 === 0 ? `這是待辦事項 ${i + 1} 的詳細描述，說明需要完成的具體工作內容。` : undefined,
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
      creatorId: creator.id,
      creatorName: creator.name,
      dueAt: dueDate?.toISOString(),
      completedAt: completedDate?.toISOString(),
      linkedDiaryId: i % 5 === 0 ? `diary-${i + 1}` : undefined,
      parentTodoId: undefined,
      tags: todoTags,
      commentCount: Math.floor(Math.random() * 5),
      attachmentCount: Math.floor(Math.random() * 3),
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString()
    });
  }

  return todos;
}

function getTodoTitle(index: number): string {
  const titles = [
    '完成工地安全檢查報告',
    '確認材料供應商報價',
    '提交週進度報告',
    '安排施工協調會議',
    '檢查消防設備安裝',
    '審核工程變更申請',
    '確認驗收時間',
    '準備竣工文件',
    '跟進缺失改善',
    '更新施工進度表',
    '確認水電管路配置',
    '安排品質檢驗',
    '處理客戶需求變更',
    '協調分包商進場',
    '確認保險事項'
  ];
  return titles[index % titles.length];
}

const todoList = generateTodos(50);

function getTodos(params: any): { total: number; list: any[] } {
  let result = [...todoList];

  // Filter by workspaceId
  if (params.workspaceId) {
    result = result.filter(t => t.workspaceId === params.workspaceId);
  }

  // Filter by blueprintId
  if (params.blueprintId) {
    result = result.filter(t => t.blueprintId === params.blueprintId);
  }

  // Filter by status
  if (params.status) {
    result = result.filter(t => t.status === params.status);
  }

  // Filter by assignee
  if (params.assigneeId) {
    result = result.filter(t => t.assigneeId === params.assigneeId);
  }

  // Filter by priority
  if (params.priority) {
    result = result.filter(t => t.priority === params.priority);
  }

  // Pagination
  const pi = +(params.pi || 1);
  const ps = +(params.ps || 20);
  const start = (pi - 1) * ps;

  return {
    total: result.length,
    list: result.slice(start, start + ps)
  };
}

function createTodo(body: any): any {
  const creator = assignees.find(a => a.id === body.creatorId) || assignees[0];
  const assignee = body.assigneeId ? assignees.find(a => a.id === body.assigneeId) : null;

  const newTodo = {
    id: `todo-${Date.now()}`,
    ...body,
    status: body.status || 'open',
    priority: body.priority || 'normal',
    creatorName: creator.name,
    assigneeName: assignee?.name,
    tags: body.tags || [],
    commentCount: 0,
    attachmentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  todoList.unshift(newTodo);
  return newTodo;
}

function updateTodo(id: string, body: any): any {
  const index = todoList.findIndex(t => t.id === id);
  if (index === -1) {
    return { error: 'Todo not found' };
  }

  // Handle status change to done
  if (body.status === 'done' && todoList[index].status !== 'done') {
    body.completedAt = new Date().toISOString();
  }

  // Handle assignee change
  if (body.assigneeId) {
    const assignee = assignees.find(a => a.id === body.assigneeId);
    body.assigneeName = assignee?.name;
  }

  todoList[index] = {
    ...todoList[index],
    ...body,
    updatedAt: new Date().toISOString()
  };
  return todoList[index];
}

function deleteTodo(id: string): any {
  const index = todoList.findIndex(t => t.id === id);
  if (index === -1) {
    return { error: 'Todo not found' };
  }
  todoList.splice(index, 1);
  return { msg: 'ok' };
}

function batchUpdateStatus(ids: string[], status: string): any {
  const updated: any[] = [];
  ids.forEach(id => {
    const index = todoList.findIndex(t => t.id === id);
    if (index !== -1) {
      const body: any = { status };
      if (status === 'done') {
        body.completedAt = new Date().toISOString();
      }
      todoList[index] = {
        ...todoList[index],
        ...body,
        updatedAt: new Date().toISOString()
      };
      updated.push(todoList[index]);
    }
  });
  return { updated };
}

// endregion

export const TODOS = {
  '/api/todos': (req: MockRequest) => getTodos(req.queryString),
  '/api/todos/:id': (req: MockRequest) => todoList.find(t => t.id === req.params.id),
  'POST /api/todos': (req: MockRequest) => createTodo(req.body),
  'PUT /api/todos/:id': (req: MockRequest) => updateTodo(req.params.id, req.body),
  'DELETE /api/todos/:id': (req: MockRequest) => deleteTodo(req.params.id),
  'POST /api/todos/batch-status': (req: MockRequest) => batchUpdateStatus(req.body.ids, req.body.status)
};
