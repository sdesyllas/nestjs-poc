import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'demo', password: 'demo123' })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(() => app.close());

  it('GET /api/health is public', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect((res) => {
      expect(res.body.status).toBe('ok');
    });
  });

  it('rejects requests without a token', () => {
    return request(app.getHttpServer()).get('/api/tasks').expect(401);
  });

  it('rejects bad credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'demo', password: 'nope' })
      .expect(401);
  });

  it('returns the seeded tasks for the demo user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('validates the payload and rejects unknown fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', priority: 'urgent', hacker: true })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([
        'property hacker should not exist',
        'title should not be empty',
        'priority must be one of the following values: low, medium, high',
      ]),
    );
  });

  it('creates, updates and deletes a task', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(server)
      .post('/api/tasks')
      .set(auth)
      .send({ title: 'E2E task', priority: 'high' })
      .expect(201);
    const id = created.body.id;

    await request(server)
      .patch(`/api/tasks/${id}`)
      .set(auth)
      .send({ status: 'done' })
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('done'));

    await request(server).delete(`/api/tasks/${id}`).set(auth).expect(204);
    await request(server).get(`/api/tasks/${id}`).set(auth).expect(404);
  });

  it('rejects a non-numeric id via ParseIntPipe', () => {
    return request(app.getHttpServer())
      .get('/api/tasks/abc')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
