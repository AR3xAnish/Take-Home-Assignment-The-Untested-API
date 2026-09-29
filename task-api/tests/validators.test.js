const { validateCreateTask, validateUpdateTask, validateAssignee } = require('../src/utils/validators');

describe('validators', () => {
  test('accepts valid create input', () => {
    expect(validateCreateTask({ title: 'Task', status: 'todo', priority: 'high', dueDate: '2030-01-01T00:00:00.000Z' })).toBeNull();
  });

  test.each([
    [{}, 'title is required and must be a non-empty string'],
    [{ title: '   ' }, 'title is required and must be a non-empty string'],
    [{ title: 'Task', status: 'invalid' }, 'status must be one of: todo, in_progress, done'],
    [{ title: 'Task', priority: 'urgent' }, 'priority must be one of: low, medium, high'],
    [{ title: 'Task', dueDate: 'not-a-date' }, 'dueDate must be a valid ISO date string'],
  ])('rejects invalid create input %j', (body, message) => {
    expect(validateCreateTask(body)).toBe(message);
  });

  test('accepts partial valid updates', () => {
    expect(validateUpdateTask({ priority: 'low' })).toBeNull();
    expect(validateUpdateTask({ dueDate: '2030-01-01T00:00:00.000Z' })).toBeNull();
  });

  test.each([
    [{ title: '' }, 'title must be a non-empty string'],
    [{ status: 'invalid' }, 'status must be one of: todo, in_progress, done'],
    [{ priority: 'urgent' }, 'priority must be one of: low, medium, high'],
    [{ dueDate: 'bad-date' }, 'dueDate must be a valid ISO date string'],
  ])('rejects invalid update input %j', (body, message) => {
    expect(validateUpdateTask(body)).toBe(message);
  });

  test('validates assignee names', () => {
    expect(validateAssignee('Alice')).toBeNull();
    expect(validateAssignee('   ')).toBe('assignee must be a non-empty string');
    expect(validateAssignee('')).toBe('assignee must be a non-empty string');
    expect(validateAssignee(42)).toBe('assignee must be a non-empty string');
  });
});
