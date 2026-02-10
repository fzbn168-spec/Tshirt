import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Acceptance Tests (CRM & Chat)', () => {
  let app: INestApplication;
  let adminToken: string;
  let buyerToken: string;
  let repId: string;
  let buyerCompanyId: string;
  let inquiryId: string;

  const timestamp = Date.now();
  const buyerEmail = `buyer_${timestamp}@example.com`;
  const buyerCompany = `Company_${timestamp}`;

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

  it('1. Register Buyer Company', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: buyerEmail,
        password: 'password123',
        fullName: 'Buyer 1',
        companyName: buyerCompany,
      })
      .expect(201);
      
    // Login Buyer
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: buyerEmail, password: 'password123' })
      .expect(200);
    buyerToken = loginRes.body.access_token;
    
    // Get Buyer Profile to get Company ID
    const profileRes = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    buyerCompanyId = profileRes.body.companyId;
  });

  it('2. Admin assigns Sales Rep (Self) to Buyer Company', async () => {
    // Get Admin ID (Rep ID)
    const profileRes = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    repId = profileRes.body.id;

    // Assign
    await request(app.getHttpServer())
      .patch(`/platform/companies/${buyerCompanyId}/sales-rep`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ salesRepId: repId })
      .expect(200);
  });

  it('3. Admin filters companies by Sales Rep', async () => {
    const res = await request(app.getHttpServer())
      .get(`/platform/companies?salesRepId=${repId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
      
    const company = res.body.find((c: any) => c.id === buyerCompanyId);
    expect(company).toBeDefined();
    expect(company.salesRepId).toBe(repId);
  });

  it('4. Buyer creates Inquiry', async () => {
    // Need a product/sku ID first.
    // I can fetch products public endpoint.
    const prodRes = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    
    // Check if products exist, if not, skip test or fail
    if (prodRes.body.length === 0) {
        console.warn('No products found, skipping inquiry creation');
        return;
    }

    const product = prodRes.body[0];
    const sku = product.skus[0];

    const res = await request(app.getHttpServer())
      .post('/inquiries')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        contactName: 'Buyer 1',
        contactEmail: buyerEmail,
        items: [{
          productId: product.id,
          productName: 'Test Product',
          skuId: sku.id,
          skuSpecs: 'Test Specs',
          quantity: 100,
          price: 10,
        }]
      })
      .expect(201);
      
    inquiryId = res.body.id;
  });

  it('5. Buyer sends Message', async () => {
    if (!inquiryId) return;

    await request(app.getHttpServer())
      .post(`/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ content: 'Hello Admin, I need a discount.' })
      .expect(201);
  });

  it('6. Admin receives Message and Replies', async () => {
    if (!inquiryId) return;

    // Get messages
    const msgRes = await request(app.getHttpServer())
      .get(`/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
      
    expect(msgRes.body.length).toBeGreaterThan(0);
    expect(msgRes.body[0].content).toBe('Hello Admin, I need a discount.');

    // Reply
    await request(app.getHttpServer())
      .post(`/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Sure, we can discuss.' })
      .expect(201);
  });

  it('7. Buyer sees Reply', async () => {
    if (!inquiryId) return;

    const msgRes = await request(app.getHttpServer())
      .get(`/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
      
    expect(msgRes.body.length).toBeGreaterThan(1);
    expect(msgRes.body[1].content).toBe('Sure, we can discuss.');
  });
});
