# Image Resizer (with AI features)

An online image resizing tool. Basic resizing runs entirely in the browser using the
Canvas API (no server round-trip). AI-powered features — background removal, upscaling,
and smart cropping — are handled by a Python microservice behind a Spring Boot API.

## Architecture

```
Browser (React)                  Spring Boot API            FastAPI AI service
+-----------------------+        +------------------+       +-------------------+
| Canvas-based resizing |  --->  | Orchestrates AI  |  ---> | rembg             |
| Drop image, pick size |  HTTP  | features, stores |  HTTP | Real-ESRGAN       |
| Download result       |        | metadata (MySQL) |       | OpenCV / MediaPipe|
+-----------------------+        +------------------+       +-------------------+
```

- **Frontend** (`frontend/`): React + Vite + Tailwind CSS. Handles basic resizing in the
  browser. Calls the backend only for AI features.
- **Backend** (`backend/`): Spring Boot (Java 17) REST API. Persists job/user metadata in
  MySQL and proxies AI requests to the Python service.
- **AI service** (`ai-service/`): Python FastAPI microservice. Runs the heavy ML models
  (rembg for background removal, Real-ESRGAN for upscaling, OpenCV/MediaPipe for smart crop).

## Repository layout

```
image-resizer/
├── README.md
├── frontend/                  # React + Vite + Tailwind
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx           # app entry
│       ├── App.jsx            # root component
│       ├── index.css          # Tailwind directives
│       ├── components/        # presentational components
│       ├── services/          # API client for backend AI calls
│       ├── utils/             # Canvas resize helpers
│       └── hooks/             # custom React hooks
├── backend/                   # Spring Boot (Java 17)
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/imageresizer/
│           │   └── ImageResizerApplication.java
│           └── resources/
│               └── application.properties
└── ai-service/                # Python FastAPI
    ├── requirements.txt
    ├── main.py
    └── app/
        ├── routers/            # FastAPI route modules
        ├── services/           # ML model wrappers
        └── models/             # request/response schemas
```

## Getting started

Each service runs independently. Detailed setup for each lives in its own folder once
features are added. At a high level:

1. **Frontend** — `cd frontend && npm install && npm run dev` (Vite dev server on :5173)
2. **Backend** — `cd backend && ./mvnw spring-boot:run` (requires a running MySQL instance)
3. **AI service** — `cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload`

The frontend dev server proxies `/api/*` to the backend, and the backend calls the AI
service over HTTP.

## Status

This repository currently contains only the project scaffolding. Feature work
(browser resizing, backend endpoints, AI pipelines) will be added next.
