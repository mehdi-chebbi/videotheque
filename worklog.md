---
Task ID: 1
Agent: main
Task: Build Video Archive Platform - Backend + Frontend

Work Log:
- Set up backend project (Express + TypeScript + bare SQL for PostgreSQL)
- Created DB connection pool and init script with all tables (users, projects, videos, tags, video_tags)
- Wrote middleware: JWT auth, role-based access (admin/uploader), multer upload, error handler
- Wrote services: file storage management, ffmpeg thumbnail generation + metadata extraction
- Wrote all backend routes: auth, users, projects, videos (upload/stream/search/CRUD), tags
- Backend compiles with zero TypeScript errors
- Set up frontend project (React + Vite + TypeScript + TailwindCSS 4)
- Created TypeScript types and Axios API client with JWT interceptors
- Created Zustand auth store with persist middleware
- Built shadcn/ui components: Button, Input, Textarea, Card, Label, Badge, Dialog, Select, Separator
- Built AppLayout with responsive sidebar, header, and sticky footer
- Built all pages: Login, Dashboard, Projects, Project Detail, Videos, Video Player, Upload, Users
- Frontend compiles with zero TypeScript errors

Stage Summary:
- Full backend API with 20+ endpoints ready for PostgreSQL
- Full frontend SPA with 8 pages, all routes wired up
- Both projects compile cleanly
- User needs to deploy on their k8s server with PostgreSQL and ffmpeg
