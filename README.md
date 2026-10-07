# Colegio AppCol — pry_escuelas_2

Sistema de gestión escolar: **PostgreSQL** (Docker) + API .NET 8 hexagonal (EF Core, Swagger, AutoMapper, JWT).

## Arranque rápido

### 1. Docker: PostgreSQL + pgAdmin

Con **Docker Desktop** en ejecución:

```bash
docker compose up -d
```

| Servicio | URL / puerto | Credenciales |
|----------|--------------|--------------|
| PostgreSQL local | `localhost:5432` | `postgres` / `pic103` |
| Base de datos | `colegio_appcol` | Schema + seed con `scripts/apply_seed_postgres.py` |
| pgAdmin (Docker opcional) | http://localhost:8081 | `admin@colegio.local` / `admin123` |

En pgAdmin, registra el server:
- Host: `postgres` (desde el contenedor) o `host.docker.internal` / `localhost` según red
- Port: `5432`
- User/Password: `colegio` / `colegio123`

Si el volumen ya existía sin seed:

```bash
docker compose down -v
docker compose up -d
```

## Arranque rápido

### Backend API
```bash
cd backend
dotnet run --project src/ColegioApp.Api
```
Swagger: http://localhost:5026/swagger

### Frontend Angular
```bash
cd frontend
npm install
npm start
```
App: http://localhost:4200 · Login: `admin` / `Password123!`

## Estructura

```text
├── docker-compose.yml
├── docker/postgres/init/       # 01_schema.sql + 02_seed.sql
├── diagrams/
├── docs/
├── recursos/                   # Modelo original (MySQL Workbench)
└── backend/
    └── src/
        ├── ColegioApp.Domain
        ├── ColegioApp.Application
        ├── ColegioApp.Infrastructure  # EF Core + Npgsql
        └── ColegioApp.Api
```

## Stack

- **.NET 8** Web API (hexagonal)
- **EF Core 8** + **Npgsql.EntityFrameworkCore.PostgreSQL**
- **Swagger** + **AutoMapper** + **JWT** + **BCrypt**
- **Docker**: PostgreSQL 16 + pgAdmin 4

## Usuarios de prueba (seed)

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| `admin` | admin | `Password123!` |
| `laura.gomez` | profesor | `Password123!` |
| `carlos.ruiz` | profesor | `Password123!` |
| `juan.martinez` | alumno | `Password123!` |
| `sofia.lopez` | alumno | `Password123!` |

## Connection string

```
Host=localhost;Port=5432;Database=colegio_appcol;Username=postgres;Password=pic103
```

Seed local:

```bash
python scripts/apply_seed_postgres.py
```
