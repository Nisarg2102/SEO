import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication() as any;
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const uniqueEmail = `test-${Date.now()}@test.com`;

  it('/auth/register (POST) sets cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'password123', name: 'E2E User' })
      .expect(201);
      
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/accessToken=/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
  });

  it('/auth/login (POST) sets cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(200);

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/accessToken=/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
  });

  it('/auth/logout (POST) clears cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(200);

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/accessToken=/);
    expect(res.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('unauthenticated request without cookie fails', async () => {
    await request(app.getHttpServer())
      .get('/workspaces') // Assume this requires auth
      .expect(401);
  });

  it('authenticated request with cookie succeeds', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(200);

    const cookie = loginRes.headers['set-cookie'];

    await request(app.getHttpServer())
      .get('/workspaces')
      .set('Cookie', cookie)
      .expect(200);
  });
});
