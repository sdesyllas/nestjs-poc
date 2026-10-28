# nestjs-poc

A small, full-stack **task manager** used to showcase what [NestJS](https://nestjs.com) brings to a Node.js API, with a **React (JavaScript)** frontend.

```
nestjs-poc/
├── backend/             NestJS API (TypeScript) – http://localhost:3000/api
├── frontend/            React + Vite (JavaScript) – http://localhost:5173
├── docker-compose.yml   PostgreSQL 17 – localhost:5432
└── docker/postgres/     DB init scripts (creates the e2e test database)
```

## Quick start

Requires Node.js 20.19+ (tested with Node 22) and Docker Desktop running.

```bash
npm install        # installs both workspaces
npm run dev        # starts Postgres (Docker), then API + UI together
```

- UI: http://localhost:5173 — sign in with **demo / demo123** (or **admin / admin123**)
- Swagger docs: http://localhost:3000/api/docs
- Health check: http://localhost:3000/api/health

Other scripts (from the repo root):

| Command            | What it does                         |
| ------------------ | ------------------------------------ |
| `npm run build`    | Production build of API and UI       |
| `npm test`         | Backend unit tests                   |
| `npm run test:e2e` | Backend end-to-end tests (real HTTP + Postgres; needs `db:up`) |
| `npm run db:up`    | Start Postgres and wait until it's healthy |
| `npm run db:down`  | Stop Postgres (data is kept in a Docker volume) |
| `npm run db:reset` | Delete all data and start a fresh Postgres |
| `npm run db:psql`  | Open a `psql` shell, e.g. `select * from tasks;` |

Optional backend config: copy `backend/.env.example` to `backend/.env`. The defaults already match `docker-compose.yml`.

## Database

- **PostgreSQL 17** runs in Docker (`docker-compose.yml`). Data persists in the `postgres-data` volume across restarts.
- **TypeORM** via `@nestjs/typeorm`. Tables are created from the entity classes (`task.entity.ts`, `user.entity.ts`) using `synchronize: true`, which is convenient for a demo. A real project would use migrations instead.
- On startup the API makes sure the demo users exist, and seeds sample tasks the first time the demo user has none.
- E2E tests use a separate `tasks_test` database that's wiped on every run, so they never touch your demo data.

## API

All routes are prefixed with `/api`. Everything except login and health requires a `Bearer` token.

| Method | Route         | Description                                       |
| ------ | ------------- | ------------------------------------------------- |
| POST   | `/auth/login` | Returns a JWT and the user profile                |
| GET    | `/auth/me`    | The current user                                  |
| GET    | `/tasks`      | List my tasks (`?status=done&priority=high`)      |
| GET    | `/tasks/:id`  | Get one task                                      |
| POST   | `/tasks`      | Create a task                                     |
| PATCH  | `/tasks/:id`  | Update title/description/priority/status          |
| DELETE | `/tasks/:id`  | Delete a task                                     |
| GET    | `/health`     | Liveness check                                    |

Each user only ever sees their own tasks. The demo user starts with a few sample tasks.

## Why NestJS? A walkthrough for the demo

Each point maps to real code in this repo, so you can open the file while presenting.

### 1. Structure out of the box: modules
Plain Express gives you a blank page, and every team ends up structuring it differently. Nest organises the app into **feature modules** that each own their controllers and services:

- `backend/src/app.module.ts`: the root module only wires features together
- `backend/src/tasks/tasks.module.ts`, `auth/auth.module.ts`, `users/users.module.ts`, `health/health.module.ts`

Developers who move between Nest projects find the same layout everywhere.

### 2. Dependency injection
Services are declared once with `@Injectable()`, and Nest passes them to whoever needs them through the constructor:

- `TasksController` receives `TasksService`
- `AuthService` receives `UsersService` (exported by `UsersModule`) and `JwtService`

No manual `new`, no singletons by hand. It also makes testing easy (see #7).

### 3. Validation from decorators on a class
`backend/src/tasks/dto/create-task.dto.ts` defines the request shape **once**, with `class-validator` decorators. The global `ValidationPipe` (`backend/src/app.setup.ts`):

- rejects invalid payloads with a 400 and readable messages
- strips or rejects unknown fields (`whitelist` + `forbidNonWhitelisted`), which prevents mass-assignment
- converts query/path params to the right types (`ParseIntPipe` on `:id`)

`UpdateTaskDto` reuses every rule through `PartialType(CreateTaskDto)`, with no duplication.

**Demo:** the "Try the validation" panel in the UI sends bad payloads straight to the API.

### 4. Swagger/OpenAPI docs generated from the code
The same DTO classes and decorators produce the docs at `/api/docs`, so the docs can't drift from the code. Click **Authorize**, paste the token from `/auth/login`, and try every endpoint live.

### 5. Security that's opt-out, not opt-in: guards
`backend/src/auth/jwt-auth.guard.ts` is registered **globally** (`APP_GUARD` in `auth.module.ts`). Every route is protected by default, and public routes are marked explicitly with `@Public()`. A new endpoint can't be left unprotected by accident.

`@CurrentUser()` (`auth/current-user.decorator.ts`) is a custom parameter decorator that injects the logged-in user into controller methods.

### 6. Cross-cutting concerns in one place
- **Interceptor:** `common/interceptors/logging.interceptor.ts` logs every request and its duration
- **Exception filter:** `common/filters/http-exception.filter.ts` gives every error the same JSON shape (`statusCode`, `message`, `path`, `timestamp`), which the React app depends on
- **Config:** `@nestjs/config` reads `.env` and is injected where needed (JWT secret/expiry, port)

Controllers stay focused on business logic.

### 7. Testability built in
- `tasks/tasks.service.spec.ts`: unit tests for the service with **no database**. The TypeORM repository is swapped for a mock using `getRepositoryToken(Task)`
- `tasks/tasks.controller.spec.ts`: swaps the real service for a mock through DI in one line
- `test/app.e2e-spec.ts`: starts the full app in-process against a real Postgres test database and tests auth, validation, CRUD and 404s over HTTP

### 8. It's still Node and Express
Nest runs on Express (or Fastify) under the hood. Existing middleware, npm packages and Node skills all still apply, and the React frontend is just a normal client calling a REST API.

### 9. First-class database integration
`TypeOrmModule.forRootAsync()` in `app.module.ts` reads connection settings from config. Each feature module registers its own entities with `TypeOrmModule.forFeature([Task])`, and services receive a typed repository with `@InjectRepository(Task)`. One `Task` class is both the database table and the Swagger schema.

This POC started with an in-memory store. Moving to Postgres changed only the service, entities and module imports. **The controller, DTOs, guard and frontend didn't change at all.**

### 10. Easy to grow
Nest also has first-party modules for GraphQL, WebSockets, microservices, queues, caching, scheduling and more.

## Suggested demo script (~10 min)

1. `npm run dev`, open the UI, sign in, then create, update, filter and delete tasks.
2. Click the validation demo buttons and show the error banner. Then open `create-task.dto.ts`: that's all the validation code there is.
3. Open Swagger, click **Authorize**, and call `GET /tasks`. Point out the docs came from the same decorators.
4. Show `jwt-auth.guard.ts` + `@Public()`, then call `/api/tasks` without a token to get a 401.
5. Show the request logs in the terminal (interceptor), then the consistent error JSON (filter).
6. Run `npm run db:psql` and `select * from tasks;` to show the tasks you just created.
7. Run `npm test` and `npm run test:e2e`.

> **Note:** this is a POC. Passwords are stored in plaintext, the schema uses `synchronize` instead of migrations, and the JWT secret has a dev default. Fix all three before using this beyond a demo.
