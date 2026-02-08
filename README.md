# SoleTrade B2B Platform

Enterprise-grade B2B Shoe & Apparel Sourcing Platform.

## Features

### Storefront
*   **User System**: Authentication, Profile Management, Company Verification.
*   **Product Catalog**: SKU Matrix (Color/Size), Tiered Pricing (Volume Discounts), Multi-currency.
*   **RFQ System**: Request for Quotation Cart, Inquiry History, Real-time Chat.

### Admin Panel
*   **Dashboard**: Overview of Orders, Inquiries, and Users.
*   **Product Management**: SPU/SKU CRUD, Attribute Library.
*   **CRM**: Customer Management, Sales Rep Assignment.
*   **Order Management**: Workflow from Inquiry to Payment & Shipping.

## Tech Stack
*   **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Zustand, React Query.
*   **Backend**: NestJS, Prisma, SQLite (Dev) / PostgreSQL (Prod ready).
*   **DevOps**: Docker, Docker Compose.

## Getting Started

### Prerequisites
*   Node.js 20+
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/soletrade.git
    cd soletrade
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    cp .env.example .env # Configure JWT_SECRET, etc.
    npx prisma generate
    npx prisma migrate dev --name init
    npm run start:dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access**
    *   Frontend: http://localhost:3000
    *   Backend API: http://localhost:3001
    *   Swagger Docs: http://localhost:3001/api

## Deployment

Please refer to [DEPLOY.md](DEPLOY.md) for detailed production deployment instructions using Docker.

## Testing

Run E2E tests for the backend:
```bash
cd backend
npm run test:e2e
```

## License

MIT
