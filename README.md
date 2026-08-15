# <img src="./public/logo.svg" width="38" align="center" /> LemAI

<p align="center">
  <img src="./public/logo.svg" alt="LemAI Logo" width="140" />
</p>

<h3 align="center">LemAI — Intelligent AI, Built for the Modern Web.</h3>

<p align="center">
  A modern AI assistant platform engineered by <strong>Limone Teams</strong>.
  <br />
  Designed for conversation, coding, productivity, and the next generation of AI-powered experiences.
</p>

<p align="center">
  <a href="https://github.com/redzn1/LemAI-Project">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-5%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-Powered-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Bun-Supported-FBF0DF?style=for-the-badge&logo=bun&logoColor=black" alt="Bun">
  <img src="https://img.shields.io/badge/AI-Powered-8B5CF6?style=for-the-badge" alt="AI">
</p>

<p align="center">
  <strong>Built with precision · Designed for developers · Powered by AI</strong>
</p>

---

## ✦ About LemAI

**LemAI** is an AI assistant project developed by **Limone Teams**, created with a focus on a modern user experience, scalable architecture, and developer-oriented AI capabilities.

The goal of LemAI is simple:

> **Make powerful AI feel simple, fast, and natural to use.**

LemAI is designed as a foundation that can evolve from a conversational AI interface into a broader AI platform with support for multiple models, developer workflows, tools, and intelligent features.

---

## ✨ Highlights

| Capability              | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| 🤖 **AI Chat**          | Modern conversational AI experience                  |
| 💻 **Developer Ready**  | Designed for programming and technical workflows     |
| ⚡ **Fast**              | Vite-powered development environment                 |
| 🧩 **Extensible**       | Architecture designed for future AI integrations     |
| 🔐 **Secure API Layer** | Server-side architecture for sensitive configuration |
| 📱 **Responsive**       | Designed for desktop and mobile experiences          |
| 🎨 **Modern UI**        | Clean, minimal, AI-first interface                   |
| 🛠️ **TypeScript**      | Strongly typed development environment               |

---

# 🖼️ Screenshots

> Replace the images below with real screenshots from the LemAI interface.

### Main Interface

<p align="center">
  <img src="./public/screenshots/home.png" alt="LemAI Main Interface" width="900" />
</p>

### AI Conversation

<p align="center">
  <img src="./public/screenshots/chat.png" alt="LemAI AI Chat" width="900" />
</p>

### Developer Experience

<p align="center">
  <img src="./public/screenshots/coding.png" alt="LemAI Coding Experience" width="900" />
</p>

---

# 🧠 AI Experience

LemAI is built around a flexible AI architecture.

The platform can be extended to support multiple AI models and providers without requiring the frontend to directly expose provider credentials.

### Designed for

* General conversations
* Programming
* Debugging
* Code generation
* Technical explanations
* Web development
* Full-stack development
* Writing assistance
* Research workflows
* Productivity

---

# 💻 Developer Mode

LemAI is designed with developers as a first-class audience.

Potential developer workflows include:

```text
┌─────────────────────────────────────────────┐
│                  LemAI                      │
├─────────────────────────────────────────────┤
│                                             │
│  "Create a REST API with Express + TS"      │
│                                             │
│  AI                                         │
│  ┌───────────────────────────────────────┐  │
│  │ import express from "express";       │  │
│  │                                       │  │
│  │ const app = express();                │  │
│  │                                       │  │
│  │ app.listen(3000);                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│             [ Copy Code ]                   │
└─────────────────────────────────────────────┘
```

LemAI can evolve into an AI coding companion capable of helping developers understand, generate, review, and improve code.

---

# 🏗️ Architecture

The project separates the user interface from the server/API layer.

```text
                         ┌──────────────────────┐
                         │       User           │
                         │  Desktop / Mobile    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      LemAI UI        │
                         │ TypeScript / Vite     │
                         └──────────┬───────────┘
                                    │
                              HTTP / API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Server          │
                         │      server.ts       │
                         └──────────┬───────────┘
                                    │
                           Secure API Request
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     AI Provider      │
                         │  Model / AI Service  │
                         └──────────────────────┘
```

### Why this architecture?

The separation provides a foundation for:

* API key protection
* Provider abstraction
* Model switching
* Authentication
* Rate limiting
* Request validation
* Logging
* Streaming responses
* Future AI tools

---

# 📁 Project Structure

```text
LemAI-Project/
│
├── public/
│   ├── logo.svg
│   └── screenshots/
│       ├── home.png
│       ├── chat.png
│       └── coding.png
│
├── src/
│   └── ...
│
├── .env.example
├── .gitignore
├── bun.lock
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Tech Stack

### Frontend

* TypeScript
* Vite
* Modern HTML/CSS
* Component-based UI architecture

### Backend

* TypeScript
* `server.ts`
* REST/API communication
* Environment-based configuration

### Tooling

* Bun
* npm
* Git
* GitHub

---

# 🚀 Getting Started

## Requirements

Make sure you have the following installed:

* Git
* Bun **or** Node.js
* An AI provider/API configuration

Recommended environment:

```text
Node.js 20+
Bun latest
Git latest
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/redzn1/LemAI-Project.git
```

Enter the project:

```bash
cd LemAI-Project
```

---

## 2. Install Dependencies

Using Bun:

```bash
bun install
```

Or npm:

```bash
npm install
```

---

## 3. Configure Environment

Create your environment file:

```bash
cp .env.example .env
```

Then edit:

```env
AI_API_KEY=your_api_key_here
```

> Never commit `.env` to GitHub.

---

# 🔌 API Setup

LemAI is designed to keep sensitive API credentials on the server side.

A typical architecture looks like:

```text
Frontend
   │
   │ POST /api/chat
   ▼
LemAI Server
   │
   │ API Key
   ▼
AI Provider
   │
   ▼
AI Response
   │
   ▼
Frontend
```

This prevents private API credentials from being embedded directly into browser-side JavaScript.

### Example Environment

```env
AI_API_KEY=YOUR_SECRET_KEY
```

Additional provider configuration can be added through `.env` as the API architecture evolves.

---

# ▶️ Running Locally

Start the development environment:

```bash
bun run dev
```

Or:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 📦 Production Build

Build the project:

```bash
bun run build
```

Or:

```bash
npm run build
```

Preview the production build:

```bash
bun run preview
```

---

# 🔐 Security

Security is an important part of the LemAI architecture.

### Never

```text
❌ Put API keys inside frontend source
❌ Commit .env
❌ Hard-code provider secrets
❌ Expose private credentials through client requests
```

### Prefer

```text
✅ Server-side API calls
✅ Environment variables
✅ Request validation
✅ Rate limiting
✅ HTTPS in production
✅ Secure secret management
```

---

# 🗺️ Roadmap

## Foundation

* [x] Initial LemAI project
* [x] Modern frontend architecture
* [x] TypeScript
* [x] Vite
* [x] Server/API foundation
* [x] Environment configuration

## AI Platform

* [ ] Multi-model support
* [ ] Model selector
* [ ] Streaming responses
* [ ] Conversation history
* [ ] Persistent conversations
* [ ] AI memory
* [ ] Custom system prompts

## Developer Tools

* [ ] Advanced code blocks
* [ ] One-click code copying
* [ ] Code preview
* [ ] Multi-file workspace
* [ ] Integrated editor
* [ ] AI debugging
* [ ] AI refactoring
* [ ] Web development preview

## Advanced AI

* [ ] File uploads
* [ ] Image understanding
* [ ] Web search
* [ ] Tool calling
* [ ] AI agents
* [ ] Voice input
* [ ] Text-to-speech
* [ ] Function calling

## Platform

* [ ] User authentication
* [ ] Cloud conversation sync
* [ ] User profiles
* [ ] PWA
* [ ] Mobile optimization
* [ ] Usage analytics
* [ ] Admin dashboard

---

# 🧪 Development Philosophy

LemAI follows several principles:

### 01 — Simple

Powerful technology should not require a complicated interface.

### 02 — Fast

AI interaction should feel immediate and responsive.

### 03 — Extensible

The architecture should make future features easy to integrate.

### 04 — Secure

Sensitive credentials belong on the server, not inside the browser.

### 05 — Developer Friendly

LemAI should be useful not only for chatting, but also for building software.

---

# 🤝 Contributing

Contributions are welcome.

### Fork the project

```bash
git clone https://github.com/redzn1/LemAI-Project.git
cd LemAI-Project
```

### Create a branch

```bash
git checkout -b feature/my-feature
```

### Make your changes

```bash
git add .
git commit -m "feat: add my feature"
```

### Push

```bash
git push origin feature/my-feature
```

Then open a Pull Request on GitHub.

---

# 🐛 Bug Reports

Found a problem?

Please create a GitHub Issue and include:

* Clear description
* Steps to reproduce
* Expected behavior
* Actual behavior
* Browser/device
* Console errors
* Screenshots when possible

---

# 💡 Feature Requests

Have an idea for LemAI?

We'd love to hear it.

When submitting a feature request, explain:

1. What the feature does
2. Why it is useful
3. How it could work
4. Any relevant examples

---

# 🌐 Repository

<p align="center">

<a href="https://github.com/redzn1/LemAI-Project">
  <img src="https://img.shields.io/badge/View%20Repository-GitHub-181717?style=for-the-badge&logo=github" alt="Repository">
</a>

</p>

---

# 🏢 About Limone Teams

**LemAI is proudly developed by Limone Teams.**

Limone Teams is a development team focused on building modern software, AI systems, web applications, developer tools, and experimental technology.

```text
╭─────────────────────────────────────╮
│                                     │
│          LIMONE TEAMS               │
│                                     │
│     Build · Create · Innovate       │
│                                     │
╰─────────────────────────────────────╯
```

---

# 📄 License

See the repository's license configuration for the current licensing terms.

---

<p align="center">
  <img src="./public/logo.svg" alt="LemAI" width="72" />
</p>

<h3 align="center">LemAI</h3>

<p align="center">
  <strong>Intelligence, engineered differently.</strong>
</p>

<p align="center">
  Developed with passion by <strong>Limone Teams</strong>.
</p>

<p align="center">
  <a href="https://github.com/redzn1/LemAI-Project">GitHub</a>
  •
  <a href="https://github.com/redzn1/LemAI-Project/issues">Issues</a>
  •
  <a href="https://github.com/redzn1/LemAI-Project/pulls">Pull Requests</a>
</p>

<p align="center">
  <sub>© 2026 Limone Teams. All rights reserved.</sub>
</p>
