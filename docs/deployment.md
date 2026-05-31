# Deployment Guide

This project deploys cleanly as three pieces:

- PostgreSQL database on Render.
- Flask API backend on Render.
- Vite/React frontend on Vercel.

Docker images are optional. Render can build the backend directly from `backend/Dockerfile`, and Vercel should build the frontend from source. Use pushed Docker images only if you specifically want registry-based deployments.

## Backend And PostgreSQL On Render

### Option A: Render Blueprint

Use the root-level `render.yaml` to create both the Render PostgreSQL database and the backend web service from the repo.

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the GitHub repo.
3. Render will create:
   - `inventory-order-db`: PostgreSQL database.
   - `inventory-order-api`: Docker web service from `backend/Dockerfile`.
4. When Render prompts for `ALLOWED_ORIGINS`, enter the deployed Vercel frontend URL, for example `https://your-app.vercel.app`.
5. Keep the health check path as `/health`.

The backend container runs `alembic upgrade head` before starting Gunicorn.

### Option B: Manual Render Setup

1. Create a Render PostgreSQL database.
2. Copy its internal database URL.
3. Create a Render Web Service from this repository.
4. Set the root directory to `backend`.
5. Use Docker as the runtime. Render will use `backend/Dockerfile`.
6. Add environment variables:
   - `DATABASE_URL`: Render PostgreSQL internal URL. Both `postgresql://...` and `postgresql+psycopg://...` are accepted by the app.
   - `SECRET_KEY`: long random value.
   - `ALLOWED_ORIGINS`: deployed Vercel URL, for example `https://your-app.vercel.app`.
   - `LOW_STOCK_THRESHOLD`: `10`.
   - `ENVIRONMENT`: `production`.
7. Health check path: `/health`.

## Frontend on Vercel

1. Import the same repository in Vercel.
2. Set the root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variable:
   - `VITE_API_BASE_URL`: Render backend URL with `/api`, for example `https://inventory-api.onrender.com/api`
6. Deploy.

The `frontend/vercel.json` file rewrites browser routes to `index.html`, so refreshing `/products`, `/customers`, or `/orders` works with React Router.

## Docker Images

You do not need Docker Hub for the normal Render plus Vercel deployment above.

This repo includes `.github/workflows/docker-images.yml`, which publishes images to GitHub Container Registry on pushes to `main`/`master` or manual workflow runs:

- `ghcr.io/<github-user-or-org>/inventory-backend:latest`
- `ghcr.io/<github-user-or-org>/inventory-frontend:latest`
- SHA-tagged versions for each commit.

Before publishing the frontend image, set the GitHub Actions repository variable `VITE_API_BASE_URL` to the Render API URL with `/api`, for example `https://inventory-api.onrender.com/api`.

If you prefer Docker Hub, build and push both images manually:

```bash
docker build -t your-dockerhub-user/inventory-backend:latest ./backend
docker push your-dockerhub-user/inventory-backend:latest

docker build --build-arg VITE_API_BASE_URL=https://inventory-api.onrender.com/api -t your-dockerhub-user/inventory-frontend:latest ./frontend
docker push your-dockerhub-user/inventory-frontend:latest
```

If deploying the backend from a registry image on Render, create a Web Service from an existing image and set the same environment variables listed above. For Vercel, source deployment is still the better fit for this frontend; the frontend Docker image is mainly for self-hosting or container platforms.

## Backend Docker Hub Submission

This repo includes `.github/workflows/docker-hub.yml` for the backend image required by the submission.

1. Create a Docker Hub repository named `inventory-backend`.
2. In Docker Hub, create an access token.
3. In GitHub, add repository secrets:
   - `DOCKERHUB_USERNAME`: your Docker Hub username.
   - `DOCKERHUB_TOKEN`: your Docker Hub access token.
4. Run the `Docker Hub Backend Image` workflow from the GitHub Actions tab.
5. Submit this Docker Hub image link:

```text
docker.io/your-dockerhub-user/inventory-backend:latest
```
