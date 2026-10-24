# KCC Web Portal - Modern Bilingual Web Application

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Database-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-forest?style=flat-square)](LICENSE)

A high-performance, bilingual (English & Tamil) single-page web application and content management portal. Built with **React 19**, **Vite 6**, and **Tailwind CSS**, featuring hardware-accelerated 3D CSS transforms, global keyboard shortcuts, real-time client-side fuzzy search, headless CMS synchronization via GitHub API and Cloudflare Pages Functions, and Firebase authentication.

---

## 🌐 Live Application

* **Production URL:** [https://jkcc.edu.lk/](https://jkcc.edu.lk/)
* **Repository:** [https://github.com/Sivodayan/KCC-Web-Public](https://github.com/Sivodayan/KCC-Web-Public)

---

## ⚡ Core Technical Features

### 1. 3D Transforms & Interactive UI
* **Hardware-Accelerated 3D Coverflow Carousel:** Custom CSS perspective (`perspective: 1200px`) carousel supporting multi-modal input (touch swipe, mouse wheel delta, indicator dots, keyboard arrows, and continuous auto-rotation).
* **Viewport-Triggered Entrance Animations:** Uses `IntersectionObserver` to trigger smooth 3D fan-in animations and counter easing (`easeOutExpo`) when sections scroll into view.
* **Accessible 3D Flip Cards:** Two-sided card components utilizing `transform-style: preserve-3d` and `backface-visibility: hidden` for language toggling via hover, touch, or keyboard focus (`Enter` / `Space`).

### 2. Search & Command Palette (`Ctrl + K`)
* **Global Command Dialog:** Keyboard-driven modal accessible from any route via `Ctrl + K` or `/`.
* **Client-Side Fuzzy Indexing:** Instant querying across nested navigation routes, archival content, and metadata without round-trip network latency.
* **Keyboard Navigation:** Full arrow key navigation, focus trapping, and `Escape` dismissal.

### 3. Dual-Context State Management
* **`SiteContentContext`:** Centralized reactive data store providing dynamic content overrides, fallback defaults (`siteContent.json`), and live update synchronization.
* **`ThemeContext`:** Manages theme preferences with automatic detection of system dark/light mode and persistent `localStorage` state.

### 4. Headless CMS & GitHub Sync Pipeline
* **In-App Administration Portal (`/admin`):** Secured management interface protected by Firebase Authentication.
* **Automated Git Commits via API:** Edits to site content are staged, formatted, and committed directly back to the GitHub repository through a serverless API proxy (`/functions/api/github.js`), eliminating the need for a separate database backend.
* **Facebook Graph Resolution:** Serverless edge worker (`/functions/api/resolve-facebook.js`) to dynamically parse social feeds and event data.

### 5. Internationalization (i18n) & Typography
* **Bilingual Switcher:** Instant runtime language toggle between English and Tamil (தமிழ்) with state preservation.
* **Font Optimization:** Dynamic font pairing using **Plus Jakarta Sans** for Latin script and **Noto Sans Tamil** for Unicode Tamil rendering.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Open / close Command Palette search modal |
| <kbd>/</kbd> | Open search (when not typing in an input) |
| <kbd>Esc</kbd> | Dismiss active modal or overlay |
| <kbd>←</kbd> / <kbd>→</kbd> | Navigate 3D Coverflow gallery slides |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Trigger 3D card flip when focused |

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   React 19 (SPA)  •  React Router 7  •  Tailwind CSS        │
│   SiteContentContext  •  ThemeContext  •  3D CSS Pipeline   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Cloudflare Pages Edge      │ │    Firebase Services       │
│   • /api/github              │ │    • Authentication        │
│   • /api/resolve-facebook    │ │    • Realtime DB / Storage │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│       GitHub REST API        │
│  Automated commits to repo   │
└──────────────────────────────┘
```

* **Frontend Framework:** [React 19](https://react.dev/)
* **Router:** [React Router 7](https://reactrouter.com/)
* **Build System:** [Vite 6](https://vitejs.dev/)
* **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) + Custom CSS 3D transforms & keyframes
* **Hosting & Edge Compute:** [Cloudflare Pages](https://pages.cloudflare.com/) + Cloudflare Workers Functions
* **Backend & Auth:** [Firebase 13](https://firebase.google.com/)
* **Version Control & Headless Data Store:** [GitHub REST API](https://docs.github.com/en/rest)

---

## 📁 Repository Structure

```text
├── functions/                     # Cloudflare Pages Serverless Functions
│   └── api/
│       ├── github.js              # GitHub API proxy for automated content commits
│       └── resolve-facebook.js    # Facebook Graph API resolver
├── public/
│   ├── assets/                    # Media assets, images, and branding
│   ├── _headers                   # Security headers (CSP, HSTS, X-Frame-Options)
│   ├── _redirects                 # SPA routing fallbacks for Cloudflare Pages
│   ├── robots.txt                 # Search engine crawler policies
│   └── sitemap.xml                # XML sitemap
├── src/
│   ├── components/                # Modular UI components
│   │   ├── AboutDropdown.jsx      # Navigation dropdown menus
│   │   ├── AnthemModal.jsx        # Accessible media modal dialog
│   │   ├── Contact.jsx            # Validated inquiry submission form
│   │   ├── Footer.jsx             # Site footer with responsive navigation
│   │   ├── Gallery.jsx            # 3D interactive coverflow carousel
│   │   ├── Hero.jsx               # Dynamic landing hero section
│   │   ├── HistoryTimeline.jsx    # Chronological history timeline component
│   │   ├── LeadershipDirectory.jsx# Tabular directory listing component
│   │   ├── Navbar.jsx             # Sticky responsive navigation with theme/lang toggles
│   │   ├── Performance.jsx        # Easing counter statistics components
│   │   ├── Principles.jsx         # 3D CSS flip-cards
│   │   ├── SchoolEvents.jsx       # Event feed cards and calendar display
│   │   ├── SearchModal.jsx        # Command palette fuzzy search dialog
│   │   └── ThemeToggle.jsx        # Dark/light mode switcher
│   ├── context/
│   │   ├── SiteContentContext.jsx # Central reactive CMS content state
│   │   └── ThemeContext.jsx       # Theme state manager
│   ├── data/
│   │   ├── facebookEvents.js      # Social feed data definitions
│   │   └── siteContent.json       # Default fallback content schema
│   ├── pages/
│   │   ├── AdminPage.jsx          # Protected administration CMS dashboard
│   │   ├── AnthemPage.jsx         # Media presentation route
│   │   ├── ContactPage.jsx        # Contact route
│   │   ├── EventsPage.jsx         # Events listing route
│   │   ├── GalleryPage.jsx        # Dedicated gallery route
│   │   ├── HistoryPage.jsx        # Archival timeline route
│   │   └── HomePage.jsx           # Landing page container
│   ├── utils/
│   │   ├── githubSync.js          # Client-side GitHub API integration
│   │   └── imageUpload.js         # Media optimization and upload helpers
│   ├── App.jsx                    # Root layout and global key listener
│   ├── index.css                  # Tailwind directives and 3D transform keyframes
│   └── main.jsx                   # Application entry point
├── tailwind.config.js             # Tailwind design tokens and extensions
├── vite.config.js                 # Vite build settings and optimization rules
├── wrangler.json                  # Cloudflare Pages deployment configuration
└── package.json                   # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** `v18.x` or higher
* **npm:** `v9.x` or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sivodayan/KCC-Web-Public.git
   cd KCC-Web-Public
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles production bundle with tree-shaking into `dist/`. |
| `npm run preview` | Locally serves the production build for testing. |

---

## ☁️ Deployment (Cloudflare Pages)

The project is configured for continuous deployment on [Cloudflare Pages](https://pages.cloudflare.com/):

### Build Settings
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Build Output Directory:** `dist`
* **Root Directory:** `/`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
