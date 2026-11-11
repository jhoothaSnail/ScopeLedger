# Deploying ScopeLedger

ScopeLedger is three pieces. Each can live on any host that supports it:

```
Browser ──► Frontend (static files)  ──►  Backend (Docker, Spring Boot)  ──►  MySQL 8
            built from /frontend           built from /backend/Dockerfile        managed database
```

> Free-tier limits, sleep behaviour and pricing change often. Check each provider's current terms
> when you sign up. Nothing below depends on a specific company.

## 0. Before you start

- [ ] `dev` is merged into `main` (hosts normally deploy from `main`).
- [ ] You have accounts for: a MySQL host, a container/web-service host (backend), a static host (frontend).
- [ ] **Never commit passwords.** Enter them only in the host's environment-variable settings.
- [ ] Use a **new, strong database password** for the online database (not the one you use locally).

## 1. Database (managed MySQL 8)

Create a MySQL **8.x** database and note its host, port, database name, user and password.

Build the JDBC URL from those details:

```
jdbc:mysql://<HOST>:<PORT>/<DATABASE>?sslMode=REQUIRED&serverTimezone=UTC
```

- Managed databases normally require TLS, hence `sslMode=REQUIRED`. If the provider says TLS is
  optional and connections fail, ask its docs for the right `sslMode`.
- Tables are created automatically on first start, and the sample project is added **only if the
  database is empty**. Later restarts and redeploys never overwrite data.

## 2. Backend (Docker container)

Create a **Docker web service** from this repository:

| Setting | Value |
|---|---|
| Root / build context | `backend` |
| Dockerfile | `backend/Dockerfile` |
| Health check path | `/api/v1/health` |
| Port | the platform's `PORT` (the app reads it automatically; default 8080) |

Environment variables:

| Variable | Example | Notes |
|---|---|---|
| `DB_URL` | `jdbc:mysql://db.example.com:3306/scopeledger?sslMode=REQUIRED&serverTimezone=UTC` | from step 1 |
| `DB_USER` | `scopeledger` | |
| `DB_PASS` | *(your new password)* | secret; never commit |
| `CORS_ORIGINS` | `https://your-site.example.com` | your **frontend** URL, no trailing slash. Comma-separate several. Set after step 3 |
| `DEMO_RESET_ENABLED` | `true` | `false` hides the "Restore sample data" wipe from visitors |
| `SEED_ON_EMPTY` | `true` | optional; `false` starts with an empty database |
| `DB_POOL_SIZE` | `5` | optional; lower it on small database plans |

Deploy, then open `https://<backend-url>/api/v1/health`. You should see `{"status":"UP"}`.
Then `https://<backend-url>/api/v1/projects/1/board` should return the sample project as JSON.

## 3. Frontend (static site)

Create a **static site** from this repository:

| Setting | Value |
|---|---|
| Base / root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Node version | 20 or newer |

Environment variable **at build time**:

| Variable | Example |
|---|---|
| `VITE_API_BASE` | `https://<backend-url>/api/v1` (https, no trailing slash) |

The frontend and backend must both be **https**; browsers block an https page from calling an http API.

After the frontend has a URL, go back to step 2 and set `CORS_ORIGINS` to that URL, then redeploy the backend.

## 4. Smoke test (about 3 minutes)

- [ ] The site opens and shows the sign-in page. Sign in as a sample profile.
- [ ] The top bar says **Connected** (not "Offline · sample data").
- [ ] The Overview shows ₹1,00,000 and 20 days.
- [ ] Open the board, click *Email Login API*, **Explore a change** (12 h, 2 days), switch off *PDF Invoice Template*:
      the summary shows **+₹4,000** and **no change** in timeline.
- [ ] **Approve change**; the board reloads and *Change history* shows the entry with a correct time.
- [ ] Redeploy or restart the backend: the approved change is **still there**.
- [ ] **Restore sample data** returns everything to the original state (if you left reset enabled).

## 5. Things to know

- **Everyone shares one project.** Anyone with the link can approve changes or press *Restore sample data*.
  The sign-in is a demo profile picker, not real security. Set `DEMO_RESET_ENABLED=false` if you
  do not want visitors able to wipe the data.
- **Free backends may sleep** when idle; the first request afterwards can take around a minute.
  Open the health URL before a demo to wake it.
- **Cold database connections**: if you see occasional connection errors after long idle periods,
  lower `DB_POOL_SIZE` or check the provider's idle-timeout settings.
- **Resetting from your side**: with reset enabled, `curl -X POST https://<backend-url>/api/v1/demo/reset`.
- **Secrets**: the code falls back to user `root` / password `root` when `DB_USER` / `DB_PASS` are not
  set. That is only for local development. Always set both on the host.

## 6. Run the same container locally (optional check)

```bash
docker network create sl-net
docker run -d --name sl-db --network sl-net -e MYSQL_ROOT_PASSWORD=localtest -e MYSQL_DATABASE=scopeledger_db mysql:8.0
docker build -t scopeledger-backend backend
docker run -d --name sl-api --network sl-net -p 8080:8080 \
  -e DB_URL='jdbc:mysql://sl-db:3306/scopeledger_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC' \
  -e DB_USER=root -e DB_PASS=localtest scopeledger-backend
curl http://localhost:8080/api/v1/health
```
