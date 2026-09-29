# Local Development Guide

This guide explains how to manage the local Docker infrastructure for the AI Marketing & SEO Assistant.

## Prerequisites
- Docker & Docker Compose
- Node.js & npm

## Managing Docker Infrastructure

We use Docker Compose to run our local database (PostgreSQL + pgvector) and management tools (pgAdmin).

### Start Docker Services
To start PostgreSQL and pgAdmin in the background:
```bash
docker compose up -d
```

### Stop Docker Services
To stop the running containers without deleting data:
```bash
docker compose stop
```

To stop and completely remove the containers (your database data will remain in the volume):
```bash
docker compose down
```

### View Logs
To view logs for all services:
```bash
docker compose logs -f
```
To view logs for a specific service (e.g., postgres):
```bash
docker compose logs -f postgres
```

### Reset the Development Database
If you need to completely wipe your local database and start fresh:
1. Stop the containers and delete the volumes:
   ```bash
   docker compose down -v
   ```
2. Restart the containers:
   ```bash
   docker compose up -d
   ```

## Connecting to PostgreSQL

### From the application
The NestJS backend automatically connects using the `DATABASE_URL` defined in `.env`:
`postgresql://postgres:supersecretpassword@localhost:5432/ai_marketing?schema=public`

### Using pgAdmin (Web GUI)
1. Navigate to [http://localhost:5050](http://localhost:5050)
2. Login with the credentials from your `.env`:
   - **Email:** `admin@admin.com`
   - **Password:** `admin`
3. Add a new server in pgAdmin:
   - **Name:** AI Marketing DB
   - **Connection > Host name/address:** `postgres` (use the container name, not localhost)
   - **Connection > Port:** `5432`
   - **Connection > Maintenance database:** `ai_marketing`
   - **Connection > Username:** `postgres`
   - **Connection > Password:** `supersecretpassword`

### Using CLI / External Tools
You can connect to the database using tools like `psql`, DBeaver, or DataGrip:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `ai_marketing`
- **User:** `postgres`
- **Password:** `supersecretpassword`
