# Inventory & Order Management System

A full-stack inventory and order management system for small operations teams. It includes product tracking, customer records, multi-item orders, stock deduction, dashboard metrics, PostgreSQL persistence, Docker Compose, migrations, tests, and deployment notes for Render and Vercel.

## Tech Stack

- Backend: Python 3.12, Flask, Gunicorn, SQLAlchemy, Alembic, Pydantic
- Frontend: React, React Router, Axios, Context API, React Hook Form, Tailwind CSS
- Database: PostgreSQL
- DevOps: Docker, Docker Compose, GitHub Actions

## Architecture

The backend is a modular monolith. Each domain module owns its routes, schemas, repositories, and services. The service layer holds business rules, while repositories keep persistence details contained.

```text
backend/app
  core/          settings, logging, Flask helpers, exceptions
  database/      SQLAlchemy base, session, models
  modules/
    products/
    customers/
    orders/
    dashboard/
```

The frontend follows a practical dashboard structure with layouts, pages, reusable components, API services, hooks, and context.

## Business Rules Covered

- Product SKU is unique.
- Customer email is unique.
- Product price and stock cannot be negative.
- Orders require an existing customer and existing products.
- Orders fail when inventory is insufficient.
- Order totals are calculated by the backend.
- Successful orders deduct stock in the same transaction.
- Canceling an order restores stock and keeps the order marked as canceled for history.
- API responses use a consistent success/error envelope.

## Local Setup

Copy the environment template:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Load sample data after the backend is running:

```bash
docker compose exec backend python scripts/seed.py
```

## API Overview

Assessment-facing API routes are available without a prefix. `/api` aliases also exist for the React frontend.

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`
- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`
- `GET /dashboard/summary`
- `GET /health`

## Run Tests

Backend:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Frontend:

```bash
cd frontend
npm install
npm test
```

## Docker Images

Build the backend image:

```bash
docker build -t inventory-backend:latest ./backend
```

Build the frontend image:

```bash
docker build -t inventory-frontend:latest ./frontend
```

## Deployment

Backend deployment is prepared for Render using `backend/Dockerfile`. Frontend deployment is prepared for Vercel using the `frontend` directory and Vite build output.

Detailed steps are in [docs/deployment.md](docs/deployment.md). The ER diagram is in [docs/er-diagram.md](docs/er-diagram.md).

## Environment Variables

Backend:

- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SECRET_KEY`
- `ALLOWED_ORIGINS`
- `LOW_STOCK_THRESHOLD`

Frontend:

- `VITE_API_BASE_URL`

## Screenshots

### Dashboard
![Dashboard Overview](images/Screenshot%202026-06-01%20025402.png)

### Products Management
![Products Page](images/Screenshot%202026-05-31%20205222.png)
![Add Product](images/Screenshot%202026-05-31%20205228.png)

### Customers Management
![Customers Page](images/Screenshot%202026-05-31%20205235.png)
![Add Customer](images/Screenshot%202026-05-31%20205240.png)

### Orders Management
![Orders Page](images/Screenshot%202026-05-31%20205248.png)
![Create Order](images/Screenshot%202026-05-31%20205255.png)
 
