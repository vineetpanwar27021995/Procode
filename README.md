# 🧠 ProCode AI Interviewer

ProCode is a Progressive Web App (PWA) that simulates a real-life coding interview experience. It features an AI-powered avatar that asks questions, listens to candidate intuition, provides guidance, and evaluates code submissions — just like a real interviewer.

## 🚀 Features

- 🎙️ AI Interviewer Avatar (using Anam AI)
- 🎧 Voice recognition for intuition explanation
- 👨‍💻 Real-time collaborative code editor
- 🤖 Backend evaluation of code & intuition using DeepSeek
- 🔥 Firebase Authentication
- ☁️ Cloud Run (GCP) + Vercel Deployments
- ⚙️ Monorepo with CI/CD workflows
- 🛠️ PWA: Offline-ready, mobile-optimized

---

## 📦 Monorepo Structure

```
ProCode/
│
├── backend/            # Node.js (Express) Backend
│   └── server.js       # Handles API & Anam AI SDK
│
├── frontend/           # React Frontend (CRA + PWA)
│   └── src/
│
├── .github/workflows/  # GitHub Actions CI/CD
│
├── .env*               # Environment files (see below)
│
├── Dockerfile          # Backend deployment
└── README.md
```

---

## 🧪 Local Development

### 1. 🧱 Install Dependencies & Run

From the root of the repo, run:

```bash
npm run setup          # Installs frontend + backend deps
npm run dev            # Starts both frontend & backend concurrently
```

This will:
- Run the React frontend on [http://localhost:3000](http://localhost:3000)
- Run the Node backend on [http://localhost:8080](http://localhost:8080)

### 2. ⚙️ Setup Environment Variables (Required)

You'll need to manually create the following `.env` files for both frontend and backend:

#### ✅ `frontend/.env`

```env
REACT_APP_NEETCODE_TOKEN="XXX"
PERSONA_ID="XXX"
REACT_APP_FIREBASE_API_KEY="XXX"
REACT_APP_FIREBASE_AUTH_DOMAIN="XXX"
REACT_APP_FIREBASE_PROJECT_ID="XXX"
REACT_APP_FIREBASE_STORAGE_BUCKET="XXX 
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="XXX"
REACT_APP_FIREBASE_APP_ID="XXX"
REACT_APP_FIREBASE_MEASUREMENT_ID="XXX"
```

#### ✅ `backend/.env`
Used by Node.js backend.

```env
PORT=8080
DEEPSEEK_API_KEY="XXX"
DEEPSEEK_BASE_URL="XXX"
EMAIL_USER="XXX"
EMAIL_PASS="XXX"
FIREBASE_API_KEY="XXX"
FIREBASE_STORAGE_BUCKET="XXX"
ANAM_AI_API_KEY="XXX"
JUDGE0_API_KEY="XXX"
```

> 🔐 **Important:** Add all `.env` files to `.gitignore` and never commit them to the repo.

---

## ☁️ Deployment

### 🚀 Frontend - Vercel (CI/CD Enabled)
- Auto deploys from `main` branch using Vercel
- Reads `REACT_APP_BACKEND_URL` from `.env.production`

### 🚀 Backend - GCP Cloud Run (via GitHub Actions)
- Triggered on changes to `backend/**`
- Deploys via Docker to GCP Cloud Run

> Setup instructions inside `.github/workflows/deploy-backend.yml`

---

## 📜 Scripts

```bash
npm run setup          # Installs all dependencies
npm run dev            # Starts both frontend & backend (localhost)
npm run start:frontend # Start frontend only
npm run start:backend  # Start backend only
```

---

## 🙌 Credits

- Anam AI - Talking Avatar SDK
- DeepSeek - Code + Intuition Analyzer
- Firebase - Auth
- Vercel + GCP - Deployment

---

Made with 💙 by the ProCode Team
- Bhupesh Chikara
- Vineet Panwar
