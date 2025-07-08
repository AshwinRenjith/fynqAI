# ✨ fynqAI — Your AI Tutor & Learning Companion

![Vite](https://img.shields.io/badge/Built%20With-Vite-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?logo=tailwindcss)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.x-009688?logo=fastapi)
![Django](https://img.shields.io/badge/Django-5.2.x-092E20?logo=django)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)
![Google Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?logo=google)

---

> **Welcome to fynqAI!**
>
> _"Your intelligent learning companion that makes complex problems simple. Ask questions, upload images, share your study materials — and learn like never before! ✨"_

---

## 🌈 Table of Contents

- [Project Vision](#project-vision)
- [Live Demo](#live-demo)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Supabase Schema](#supabase-schema)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Vision

**fynqAI** is a next-gen AI-powered learning platform. It combines:
- **Conversational AI** (Google Gemini)
- **Real-time chat & file upload**
- **Personalized learning** (Supabase user profiles, survey)
- **Modern, beautiful UI** (React, Tailwind, Shadcn/UI)

> _"Imagine a tutor that never sleeps, always answers, and adapts to your learning style."_

---

## 🚀 Live Demo

> _Coming soon!_

---

## ✨ Features

- **🧑‍🎓 AI Chat**: Ask questions, get step-by-step solutions, and learn interactively.
- **📸 Photo Problem Solver**: Upload images of problems for instant help.
- **📚 Personal Learning**: Upload textbooks/notes for tailored tutoring.
- **🗂️ File Uploads**: Store and manage your study materials.
- **🔒 Secure Auth**: Supabase-powered sign up, sign in, and session management.
- **🌙 Dark/Light Mode**: Beautiful, accessible design for all preferences.
- **📊 Analytics**: Track your learning journey (coming soon).
- **🎮 Gamification**: Earn credits, unlock premium features (coming soon).

---

## 🖼️ Screenshots

> _Add screenshots/gifs here for UI, chat, file upload, etc._

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18 + Vite**: Lightning-fast SPA with hooks and context.
- **TypeScript**: End-to-end type safety.
- **Tailwind CSS**: Utility-first, custom design system, dark mode.
- **Shadcn/UI + Radix UI**: Accessible, beautiful UI components.
- **Supabase JS**: Real-time DB, auth, and storage.
- **React Query**: Async state management.
- **LocalForage**: Offline caching for chat.
- **Lucide, Embla, Zod, etc.**: Icons, carousel, validation, and more.

### **Backend**
- **FastAPI**: Async REST API for AI, file/image endpoints.
- **Django 5.2**: Admin, ORM, static files.
- **Starlette**: ASGI router, mounts FastAPI and Django.
- **Uvicorn**: ASGI server.
- **Google Gemini**: LLM for chat/AI.
- **Supabase (external)**: Auth, Postgres DB, storage.
- **SQLite**: Local dev DB for Django.

---

## 🏗️ Architecture

```mermaid
graph TD
  subgraph Frontend (React+Vite+TS)
    A[User UI] --> B[Supabase JS Client]
    A --> C[REST API Helper]
  end
  subgraph Supabase Cloud
    B --> D[Auth]
    B --> E[Postgres DB]
    B --> F[Storage]
  end
  subgraph Backend (FastAPI+Django)
    C --> G[FastAPI Endpoints]
    G --> H[Google Gemini]
    G --> I[Django ORM/SQLite]
    G --> J[File/Image Upload]
  end
  D -. issues JWT .-> A
  E <--> B
  F <--> B
  A -. JWT .-> G
```

### **Data Flow**
- **User Auth**: Supabase issues JWT, stored in localStorage, sent to backend.
- **Chat Data**: Managed in Supabase, accessed directly from frontend.
- **AI Chat**: User message sent to FastAPI, which calls Gemini and returns response.
- **File/Image Upload**: Sent to FastAPI, placeholder for future AI processing.

---

## 🗄️ Supabase Schema (Simplified)

| Table            | Fields (Key)                                   | Purpose                  |
|------------------|------------------------------------------------|--------------------------|
| chat_sessions    | id, title, created_at, updated_at, user_id      | Chat session metadata    |
| chat_messages    | id, content, session_id, created_at, is_user    | Chat message log         |
| profiles         | id, user_id, username, first_name, last_name    | User profile info        |
| survey_responses | id, user_id, ...                               | Learning preferences     |
| uploaded_files   | id, user_id, file_name, file_path, file_type    | User file uploads        |
| user_credits     | id, user_id, credits_remaining, is_premium      | Gamification, premium    |

---

## ⚙️ Setup & Installation

### **1. Clone the Repo**
```bash
git clone https://github.com/your-org/fynqAI.git
cd fynqAI
```

### **2. Install Frontend Dependencies**
```bash
npm install
```

### **3. Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

### **4. Environment Variables**
- **Frontend**: Create `.env` in root (if needed)
- **Backend**: Create `.env` in `backend/` with:
  ```env
  GEMINI_API_KEY=your_google_gemini_api_key
  ```

### **5. Run Supabase (Cloud or Local)**
- Use [Supabase Cloud](https://supabase.com/) or [local CLI](https://supabase.com/docs/guides/cli).
- Set up tables as per schema above.

### **6. Start the App**
- **Frontend**:
  ```bash
  npm run dev
  ```
- **Backend**:
  ```bash
  cd backend
  uvicorn asgi:application --reload
  ```

---

## 🧑‍💻 Development Workflow

- **Frontend**: Hot reload via Vite, TypeScript strict mode, ESLint, Jest for tests.
- **Backend**: FastAPI auto-reload, Django admin at `/admin`.
- **Supabase**: Use dashboard for DB/auth/storage.
- **Testing**: Add tests in `backend/tests/` and `src/lib/api.test.ts`.

---

## 🔌 API Endpoints (Key)

| Endpoint                  | Method | Auth | Description                       |
|---------------------------|--------|------|-----------------------------------|
| `/api/v1/chat/message`    | POST   | JWT  | Send message to Gemini AI         |
| `/api/v1/chat/image`      | POST   | JWT  | Upload image for AI (future)      |
| `/api/v1/chat/history`    | GET    | JWT  | Get chat history (future)         |
| `/api/v1/status`          | GET    | None | Backend health check              |
| `/api/v1/users/me`        | GET    | JWT  | Get current user info (future)    |

---

## 🛡️ Security

- **JWT Auth**: Issued by Supabase, sent in `Authorization: Bearer <token>`.
- **CORS**: Only whitelisted origins allowed.
- **Backend**: Token verification is a TODO (currently stubbed!).
- **Supabase**: Row-level security possible.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a PR with detailed description

> _All contributions, big or small, are welcome!_

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 💡 Minute Details & Tips

- **LocalForage**: Enables offline chat session/message caching for instant load.
- **Optimistic UI**: Chat sessions/messages appear instantly before server confirmation.
- **Theming**: Custom CSS variables for light/dark mode, with smooth transitions.
- **Supabase Types**: Strongly typed DB schema in `src/integrations/supabase/types.ts`.
- **Component Library**: All UI built with accessible, composable primitives.
- **API Helper**: Centralized fetch logic for error handling and token injection.
- **Django**: Used for admin and ORM, not for chat data (yet).
- **Google Gemini**: API key required, see `.env` setup.
- **Testing**: Add/modify tests in `backend/tests/` and `src/lib/api.test.ts`.
- **File Uploads**: Supported in UI, backend endpoint is a placeholder for future AI processing.

---

> _"fynqAI is more than an app — it's your learning partner, always ready to help, always getting smarter."_

---

**Made with ❤️ by the fynqAI Team**
