const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => taskService._reset());

  test('creates a task with defaults and generated metadata', () => {
    const task = taskService.create({ title: 'Test task' });
    expect(task).toMatchObject({
      title: 'Test task',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
  });

  test('finds and lists tasks', () => {
    const first = taskService.create({ title: 'First' });
    const second = taskService.create({ title: 'Second' });
    expect(taskService.findById(first.id)).toEqual(first);
    expect(taskService.getAll()).toHaveLength(2);
    expect(taskService.getAll()).not.toBe(taskService.getAll());
    expect(taskService.findById('missing')).toBeUndefined();
    expect(taskService.getAll()).toEqual([first, second]);
  });

  test('filters by exact status', () => {
    taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'In progress', status: 'in_progress' });
    expect(taskService.getByStatus('todo')).toHaveLength(1);
    expect(taskService.getByStatus('to')).toHaveLength(0);
  });

  test('paginates using one-based page numbers', () => {
    taskService.create({ title: 'One' });
    taskService.create({ title: 'Two' });
    taskService.create({ title: 'Three' });
    expect(taskService.getPaginated(1, 2).map((t) => t.title)).toEqual(['One', 'Two']);
    expect(taskService.getPaginated(2, 2).map((t) => t.title)).toEqual(['Three']);
  });

  test('returns status counts and overdue count', () => {
    taskService.create({ title: 'Todo', status: 'todo', dueDate: '2000-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Progress', status: 'in_progress' });
    taskService.create({ title: 'Done', status: 'done', dueDate: '2000-01-01T00:00:00.000Z' });
    expect(taskService.getStats()).toEqual({ todo: 1, in_progress: 1, done: 1, overdue: 1 });
  });

  test('updates an existing task and returns null for a missing task', () => {
    const task = taskService.create({ title: 'Old', priority: 'low' });
    const updated = taskService.update(task.id, { title: 'New', priority: 'high' });
    expect(updated).toMatchObject({ id: task.id, title: 'New', priority: 'high' });
    expect(taskService.update('missing', { title: 'Nope' })).toBeNull();
  });

  test('removes an existing task and reports missing ids', () => {
    const task = taskService.create({ title: 'Delete me' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.remove(task.id)).toBe(false);
  });

  test('completes a task without changing its priority', () => {
    const task = taskService.create({ title: 'Finish', priority: 'high' });
    const completed = taskService.completeTask(task.id);
    expect(completed.status).toBe('done');
    expect(completed.priority).toBe('high');
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('assigns an unassigned task', () => {
    const task = taskService.create({ title: 'Assign me' });
    const result = taskService.assignTask(task.id, '  Anish  ');
    expect(result.error).toBeUndefined();
    expect(result.task.assignee).toBe('Anish');
  });

  test('does not overwrite an existing assignment', () => {
    const task = taskService.create({ title: 'Assign once' });
    taskService.assignTask(task.id, 'Alice');
    const result = taskService.assignTask(task.id, 'Bob');
    expect(result.error).toBe('already_assigned');
    expect(result.task.assignee).toBe('Alice');
  });

  test('returns not_found when assigning a missing task', () => {
    expect(taskService.assignTask('missing', 'Alice')).toEqual({ error: 'not_found' });
  });
});
