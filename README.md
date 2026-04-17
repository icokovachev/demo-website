# Playwright Practice Platform

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A scenario-driven web app for practicing Playwright automation against realistic UI behavior:

- Required fields and server-side validation
- Multi-step journey flow
- Immediate and delayed redirects
- Intentionally flaky APIs and unstable UI elements
- Iframe/widget testing target

## Tech Stack

- Node.js 20+
- Express + EJS
- Static assets in `public/`
- View templates in `views/`
- Container support via Docker
- Kubernetes manifests in `k8s/`

---

## Project Structure

```text
.
├── Dockerfile
├── package.json
├── server.js
├── public/
├── views/
└── k8s/
    ├── deployment.yaml
    ├── service.yaml
    ├── namespace.yaml
    └── kustomization.yaml
```

---

## Prerequisites

### For local run (VS Code)

- VS Code
- Node.js >= 20
- npm

### For Docker run

- Docker Desktop or Docker Engine

### For Kubernetes run

- A Kubernetes cluster (Docker Desktop Kubernetes, minikube, kind, or cloud cluster)
- `kubectl`
- Kustomize support (`kubectl apply -k`)

---

## 1) Run Locally from VS Code

### Step A: Open the project

1. Open VS Code.
2. `File -> Open Folder...`
3. Select this repository folder.

### Step B: Install dependencies

```bash
npm install
```

### Step C: Start the app

```bash
npm start
```

For auto-reload during development:

```bash
npm run dev
```

### Step D: Open in browser

- Home: `http://localhost:3000/`
- Form Lab: `http://localhost:3000/forms`
- Journey Lab: `http://localhost:3000/journey`
- Redirect Lab: `http://localhost:3000/redirects`
- Flaky Lab: `http://localhost:3000/flaky`
- Iframe Widget: `http://localhost:3000/iframe`

### Step E: Health checks

```bash
curl -s http://localhost:3000/healthz
curl -s http://localhost:3000/readyz
```

Expected:

- `/healthz` -> `{"ok":true}`
- `/readyz` -> `{"ready":true}`

---

## 2) Run with Docker

### Option A: Using npm scripts (recommended)

Build image:

```bash
npm run docker:build
```

Run container:

```bash
npm run docker:run
```

Open:

- `http://localhost:3000/`

### Option B: Using raw Docker commands

Build:

```bash
docker build -t demo-web:local .
```

Run:

```bash
docker run --rm -p 3000:3000 --name demo-web demo-web:local
```

Health check from host:

```bash
curl -s http://localhost:3000/healthz
```

---

## 3) Run on Kubernetes

Kubernetes resources are managed with Kustomize in `k8s/`.

### Step A: Build and push image

Replace placeholders with your registry:

```bash
docker build -t <your-registry>/demo-web:0.1.0 .
docker push <your-registry>/demo-web:0.1.0
```

### Step B: Update deployment image

Edit `k8s/deployment.yaml` and set:

```yaml
image: <your-registry>/demo-web:0.1.0
```

### Step C: Apply manifests

Using npm script:

```bash
npm run k8s:apply
```

Or direct kubectl:

```bash
kubectl apply -k k8s
```

### Step D: Verify rollout

```bash
kubectl -n demo-web get pods
kubectl -n demo-web get svc
kubectl -n demo-web rollout status deployment/demo-web
```

### Step E: Access the service

Since Service type is `ClusterIP`, use port-forward for local access:

```bash
kubectl -n demo-web port-forward svc/demo-web 3000:80
```

Then open:

- `http://localhost:3000/`

### Step F: Remove resources

Using npm script:

```bash
npm run k8s:delete
```

Or direct kubectl:

```bash
kubectl delete -k k8s
```

---

## API Endpoints for Test Automation

### Scenario metadata

- `GET /api/scenarios`

### Form validation

- `POST /api/forms/register`

Example invalid request:

```bash
curl -s -X POST http://localhost:3000/api/forms/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"","email":"","password":"","role":""}'
```

### Flaky endpoints

- `GET /api/flaky/ping`
- `GET /api/flaky/feed`
- `GET /api/flaky/banner`

Deterministic mode (for stable baseline tests):

- `GET /api/flaky/ping?stable=1`
- `GET /api/flaky/feed?stable=1`

---

## Common Troubleshooting

### `localhost:3000` is not reachable

- Make sure the app is running (`npm start` or Docker/K8s container is up).
- Check whether another process is using port 3000.

### Docker build is slow or large

- `.dockerignore` is already configured to exclude `node_modules`, logs, and test artifacts.

### Kubernetes pod crash or image pull error

- Confirm image name/tag in `k8s/deployment.yaml` is valid and pushed.
- Check pod logs:

```bash
kubectl -n demo-web logs deployment/demo-web
```

### Probes failing

- Validate endpoints from inside cluster or via port-forward:
  - `/healthz`
  - `/readyz`

---

## Quick Command Reference

```bash
# local
npm install
npm start

# docker
npm run docker:build
npm run docker:run

# k8s
npm run k8s:apply
kubectl -n demo-web get all
npm run k8s:delete
```
