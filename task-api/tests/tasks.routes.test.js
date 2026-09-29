const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

const createTask = (overrides = {}) => request(app).post('/tasks').send({ title: 'Test task', ...overrides });

describe('Task API routes', () => {
  beforeEach(() => taskService._reset());

  test('GET /tasks returns all tasks', async () => {
    await createTask({ title: 'One' });
    const response = await request(app).get('/tasks');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test('GET /tasks?status filters exactly', async () => {
    await createTask({ status: 'todo' });
    await createTask({ status: 'in_progress' });
    const response = await request(app).get('/tasks?status=todo');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe('todo');
  });

  test('GET /tasks?page=1&limit=2 paginates correctly', async () => {
    await createTask({ title: 'One' });
    await createTask({ title: 'Two' });
    await createTask({ title: 'Three' });
    const response = await request(app).get('/tasks?page=1&limit=2');
    expect(response.status).toBe(200);
    expect(response.body.map((t) => t.title)).toEqual(['One', 'Two']);
  });

  test('GET /tasks/stats returns counts', async () => {
    await createTask({ status: 'todo' });
    await createTask({ status: 'done' });
    const response = await request(app).get('/tasks/stats');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ todo: 1, in_progress: 0, done: 1, overdue: 0 });
  });

  test('POST /tasks creates a task', async () => {
    const response = await createTask({ priority: 'high' });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ title: 'Test task', priority: 'high', status: 'todo' });
  });

  test('POST /tasks rejects invalid input', async () => {
    const response = await request(app).post('/tasks').send({ title: '   ' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/title is required/);
  });

  test('PUT /tasks/:id updates a task', async () => {
    const created = await createTask({ title: 'Old' });
    const response = await request(app).put(`/tasks/${created.body.id}`).send({ title: 'New' });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('New');
  });

  test('PUT /tasks/:id returns 404 for missing task', async () => {
    const response = await request(app).put('/tasks/missing').send({ title: 'New' });
    expect(response.status).toBe(404);
  });

  test('PUT /tasks/:id rejects invalid input', async () => {
    const created = await createTask();
    const response = await request(app).put(`/tasks/${created.body.id}`).send({ priority: 'urgent' });
    expect(response.status).toBe(400);
  });

  test('DELETE /tasks/:id deletes a task', async () => {
    const created = await createTask();
    const response = await request(app).delete(`/tasks/${created.body.id}`);
    expect(response.status).toBe(204);
    expect((await request(app).get('/tasks')).body).toHaveLength(0);
  });

  test('DELETE /tasks/:id returns 404 for missing task', async () => {
    const response = await request(app).delete('/tasks/missing');
    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/complete marks a task done and preserves priority', async () => {
    const created = await createTask({ priority: 'high' });
    const response = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('done');
    expect(response.body.priority).toBe('high');
    expect(response.body.completedAt).toEqual(expect.any(String));
  });

  test('PATCH /tasks/:id/complete returns 404 for missing task', async () => {
    const response = await request(app).patch('/tasks/missing/complete');
    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/assign assigns a task', async () => {
    const created = await createTask();
    const response = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: '  Alice  ' });
    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Alice');
  });

  test('PATCH /tasks/:id/assign rejects empty assignee', async () => {
    const created = await createTask();
    const response = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: '   ' });
    expect(response.status).toBe(400);
  });

  test('PATCH /tasks/:id/assign returns 404 for missing task', async () => {
    const response = await request(app).patch('/tasks/missing/assign').send({ assignee: 'Alice' });
    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/assign returns 409 for an already assigned task', async () => {
    const created = await createTask();
    await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Alice' });
    const response = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Bob' });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Task is already assigned');
  });
});
