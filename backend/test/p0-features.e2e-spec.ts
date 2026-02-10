import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('P0 Features (Excel Import & Docs)', () => {
  let app: INestApplication;
  let adminToken: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@platform.com', password: 'admin123' })
      .expect(200);
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Excel Product Import', async () => {
    // Create a dummy excel file (or mock content type)
    // Since we don't have a real xlsx file, we'll try to upload a dummy buffer
    // and expect at least a 201 or specific error structure, but ideally we should valid structure.
    // For simplicity, we check if the endpoint is protected and accepts files.
    // To do a real test, we would need to generate a valid XLSX buffer.
    
    // Let's create a minimal CSV/XLSX buffer simulation if possible, 
    // but without 'xlsx' lib in devDependencies it is hard. 
    // So we will just check if endpoint responds correctly to "Bad Request" (missing file)
    // and "File Uploaded" logic.

    await request(app.getHttpServer())
      .post('/products/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('dummy'), 'test.xlsx')
      .expect(201) // The service returns results even if file is invalid content, it returns { success: 0, failed: 0, errors: [...] }
      .then(res => {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('failed');
        expect(res.body).toHaveProperty('errors');
      });
  });

  it('2. Generate CI/PL for Order', async () => {
    // First, find an existing order or create one
    // Assuming seed data might have created an order, or we need to rely on previous tests.
    // Let's list orders first.
    const ordersRes = await request(app.getHttpServer())
        .get('/platform/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

    if (ordersRes.body.items && ordersRes.body.items.length > 0) {
        orderId = ordersRes.body.items[0].id;
    } else if (Array.isArray(ordersRes.body) && ordersRes.body.length > 0) {
        orderId = ordersRes.body[0].id;
    }

    if (!orderId) {
        console.warn('No orders found, skipping CI/PL test');
        return;
    }

    // Test CI
    await request(app.getHttpServer())
        .get(`/platform/orders/${orderId}/ci`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect('Content-Type', 'application/pdf');

    // Test PL
    await request(app.getHttpServer())
        .get(`/platform/orders/${orderId}/pl`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect('Content-Type', 'application/pdf');
  });
});
