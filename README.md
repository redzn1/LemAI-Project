# LemAI

<p align="center">
  <img src="./public/logo.svg" alt="LemAI Logo" width="120" />
</p>

<h3 align="center">LemAI — Modern AI Assistant</h3>

<p align="center">
  A modern, fast, and extensible AI web application built for everyday conversations, programming, and intelligent assistance.
</p>

<p align="center">
  <a href="https://github.com/redzn1/LemAI-Project">
    <img src="https://img.shields.io/badge/GitHub-LemAI-Project-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-Powered-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/AI-Assistant-8B5CF6?style=for-the-badge" alt="AI Assistant">
</p>

---

## ✨ Overview

**LemAI** is a modern AI assistant web application designed to provide a clean, responsive, and powerful interface for interacting with AI.

The project focuses on combining a polished user experience with a flexible architecture that can be extended with different AI models, programming features, and additional tools.

LemAI is built with a modern web stack and is designed to work across **desktop and mobile devices**.

---

## 🚀 Features

### 🤖 AI Assistant

* Modern AI chat interface
* Fast conversational experience
* Multi-turn conversations
* Streaming-ready architecture
* Clean and responsive chat UI
* Markdown-compatible responses
* Code block rendering
* Copy code functionality

### 💻 Programming Support

LemAI is designed with developers in mind.

Supported use cases include:

* Programming questions
* Code generation
* Code explanation
* Debugging
* Refactoring
* Web development assistance
* General software engineering
* Technical documentation

Code responses can be displayed separately from normal text and can be copied directly from the interface.

### 🌐 Web Development

LemAI can be used as an AI development companion for:

* HTML
* CSS
* JavaScript
* TypeScript
* React
* Node.js
* API development
* Frontend development
* Backend development
* Full-stack development

### ⚡ Modern Architecture

The project uses a modern TypeScript-based architecture with:

* Vite
* TypeScript
* Bun
* React-based frontend architecture
* Custom server layer
* Environment variable configuration
* Modular source structure

---

## 🧠 AI Models

LemAI is designed to support multiple AI models through a centralized API architecture.

Current model architecture can be extended to support models such as:

| Model                | Type     | Purpose                         |
| -------------------- | -------- | ------------------------------- |
| **LemAI Flash-Lite** | Fast     | Lightweight everyday tasks      |
| **LemAI 1.0 Flash**  | Fast     | General AI conversations        |
| **LemAI 1.1 Pro**    | Advanced | Complex reasoning & programming |

Model configuration should be handled through the project's API layer rather than being hard-coded throughout the UI.

---

## 🏗️ Project Structure

```text
LemAI-Project/
├── public/
│   └── logo.svg
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

## 🛠️ Requirements

Before running LemAI locally, make sure you have:

* [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/)
* Git
* An API configuration required by your selected AI backend

Recommended:

```text
Node.js 20+
Bun latest
```

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/redzn1/LemAI-Project.git
```

Enter the project directory:

```bash
cd LemAI-Project
```

Install dependencies with Bun:

```bash
bun install
```

Or with npm:

```bash
npm install
```

---

## ⚙️ Environment Configuration

Create your local environment file:

```bash
cp .env.example .env
```

Then configure the required environment variables inside `.env`.

> **Important:** Never commit private API keys or secrets to GitHub.

---

## ▶️ Development

Start the development server:

```bash
bun run dev
```

Or:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 🏭 Production Build

Create a production build:

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

## 🔌 API Architecture

LemAI uses a centralized backend/API architecture.

The frontend should communicate with the AI backend through the application's API layer instead of exposing sensitive credentials directly in browser-side code.

Conceptually:

```text
┌─────────────────────┐
│      LemAI UI       │
│   React / TypeScript│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      API Layer      │
│      server.ts      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     AI Provider     │
│  Model / Endpoint   │
└─────────────────────┘
```

This architecture makes it easier to:

* Change AI providers
* Add new models
* Protect API credentials
* Implement authentication
* Add rate limiting
* Add request validation
* Add logging
* Extend AI capabilities

---

## 🎨 Design Philosophy

LemAI aims for a UI that is:

* Minimal
* Modern
* Fast
* Developer-friendly
* Responsive
* Accessible
* Easy to navigate

The interface should prioritize the conversation itself while keeping advanced AI and developer features easily accessible.

---

## 📱 Responsive Design

LemAI is intended to work across:

* 🖥️ Desktop
* 💻 Laptop
* 📱 Mobile
* 📲 Tablet

The interface should automatically adapt to different screen sizes without requiring a separate application.

---

## 🔐 Security

When deploying LemAI, make sure to:

* Keep API keys on the server
* Never commit `.env`
* Validate API requests
* Validate user input
* Implement rate limiting where appropriate
* Avoid exposing provider credentials to the client
* Use HTTPS in production

Example:

```env
# .env
AI_API_KEY=your-secret-key
```

Do **not** place private credentials directly inside frontend source files.

---

## 🧩 Extensibility

LemAI is intended to be extensible.

Potential future integrations include:

* Multiple AI providers
* Authentication
* Conversation history
* Persistent user accounts
* File uploads
* Image understanding
* Voice input
* Text-to-speech
* Web search
* AI tools
* Function calling
* Developer tools
* Code execution
* Web preview
* Project/workspace management

---

## 🗺️ Roadmap

### Core

* [x] Modern AI chat interface
* [x] TypeScript architecture
* [x] Vite development environment
* [x] API/server architecture
* [x] Responsive UI

### AI

* [ ] Multi-model selector
* [ ] Model-specific settings
* [ ] Streaming responses
* [ ] Conversation memory
* [ ] Advanced reasoning mode

### Developer

* [ ] Advanced code blocks
* [ ] Code preview
* [ ] Multi-file projects
* [ ] Integrated editor
* [ ] Web application preview
* [ ] AI coding assistant

### Platform

* [ ] Authentication
* [ ] Cloud conversation history
* [ ] User profiles
* [ ] File management
* [ ] PWA support
* [ ] Mobile optimization

---

## 🤝 Contributing

Contributions are welcome.

To contribute:

```bash
git clone https://github.com/redzn1/LemAI-Project.git
cd LemAI-Project
bun install
```

Create a new branch:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them, then commit:

```bash
git add .
git commit -m "feat: add your feature"
```

Push your branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

## 🐛 Bug Reports

Found a bug?

Please open an issue and include:

* Description of the problem
* Steps to reproduce
* Expected behavior
* Actual behavior
* Browser/device
* Relevant console errors
* Screenshots when applicable

---

## 📄 License

This project is currently maintained by **Redzz**.

See the repository for the applicable license and usage terms.

---

## 👨‍💻 Developer

**Redzz**

GitHub:

https://github.com/redzn1

Project:

https://github.com/redzn1/LemAI-Project

---

<p align="center">
  <img src="./public/logo.svg" alt="LemAI" width="64" />
</p>

<p align="center">
  <strong>LemAI</strong>
  <br>
  Modern AI. Built for everyone.
</p>

<p align="center">
  Made with ❤️ by <strong>Redzz</strong>
</p>
