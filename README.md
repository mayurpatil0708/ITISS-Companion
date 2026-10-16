# NEXUS | System Administration Academy

> **"Master Linux. Master Windows. Own the fundamentals."**

A premium, production-grade examination preparation and diagnostic assessment platform built for the **CDAC CMCE / CCEE (Certificate Course in Enterprise System Administration)** examination and enterprise system engineers.

---

## 🌟 Overview & Key Capabilities

- **Curated Certified Question Bank**: Pre-seeded out of the box with **446 authentic CDAC CMCE questions** extracted and verified from authoritative curriculum documentation (*Devendra COSA* and *Amit COSA*), covering:
  - **Linux & Operating Systems (204 Questions)**: Kernel models, processes, ELF headers, standard streams, LVM, systemd, package managers, network daemons.
  - **Windows Server Administration (218 Questions)**: Active Directory logical structures, OUs, FSMO operations, Group Policy enforcement, PowerShell cmdlets, Hyper-V, and WSUS.
  - **Windows & Linux Cross-platform (24 Questions)**: Active Directory realm joining, SSSD configuration, Kerberos authentication, SMB/NFS interoperability, and web server comparisons.
- **Dual Quiz Execution Modes**:
  - **Practice Mode**: Immediate, contextual feedback after each answer choice with detailed explanations and pedagogical distractor rationales.
  - **Exam Mode**: Formal test simulation where correct answers remain strictly sealed until final submission.
- **Active Quiz Interface**:
  - Three-part responsive layout with Question Navigator grid, distraction-free central question card, and contextual curriculum details.
  - Non-color status indicators (Answered, Flagged for Review, Answered & Flagged, Unanswered, Current).
  - Accurate countdown timer that survives page refreshes and pauses/resumes on demand.
  - Full keyboard accessibility: keys `1-4` or `A-D` to choose options, `ArrowLeft` / `ArrowRight` to navigate, `M` to flag, `K` to bookmark.
- **Results & Diagnostic Scorecard**:
  - Raw score, accuracy among answered questions, and duration metrics.
  - Performance breakdown categorized by topic and difficulty level.
  - 1-click **"Retry Incorrect Questions"** feature to drill only missed concepts without repeating mastered items.
- **Topic Explorer**:
  - Pedagogical hierarchy: *Subject → Topic → Subtopic → Questions*.
  - Live difficulty distribution badges and direct 1-click "Practice" launch buttons.
- **Candidate Analytics**:
  - Real Recharts data visualizations: Accuracy by subject, difficulty distributions, score trends over time, and question bank coverage.
  - Honest streak calculation based on actual session dates.
  - Statistically grounded **Weak Areas Ranking** (only flags topics with $\ge 3$ attempts to eliminate misleading single-question false positives).
- **Question Bank Manager**:
  - JSON drag-and-drop import with schema validation via Zod.
  - Duplicate ID detection, invalid key detection, and comprehensive import reports.
  - Export filtered sets or full database to JSON.
  - In-browser Question Inspector with source evidence references.
  - Safe factory rollback mechanism.
- **Search & Global Command Palette**:
  - Universal `Ctrl+K` / `Cmd+K` command palette with search across questions, topics, subtopics, tags, and commands.
- **Theme & Design System**:
  - Dark-first default (`#0B0D12` background, `#10131B` sidebar, `#7777FF` indigo accent, `#42D9E8` cyan accent) alongside a fully styled light theme.
  - WCAG 2.2 AA compliant contrast, visible focus rings, and reduced-motion support.

---

## 🛠 Tech Stack

- **Framework**: React 18, TypeScript 5, Vite 6
- **Styling & Tokens**: Tailwind CSS 3, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Schema Validation**: Zod
- **Persistence**: HTML5 IndexedDB via `idb` with robust in-memory/localStorage fallbacks
- **Testing**: Vitest, React Testing Library, jsdom

---

## 🚀 Quickstart & Commands

### Prerequisites
Node.js (`>= v18`) and `pnpm` (`v9+` or `v12+`).

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm run dev
```
The application will launch at `http://localhost:5173`.

### 3. Run Automated Tests
```bash
pnpm test
```
Executes the comprehensive Vitest test suite covering:
- JSON schema validation & duplicate detection
- Quiz engine, option shuffling, and scoring logic
- Analytics calculations & streak formulas
- End-to-end 10-step critical candidate journey

### 4. Build for Production
```bash
pnpm run build
```
Creates an optimized production bundle in the `dist/` directory.

---

## 📁 Project Structure

```
├── public/
│   └── question-banks/       # Static question bank seed assets
├── src/
│   ├── config/
│   │   └── app.config.ts     # Central application configuration & identity
│   ├── context/
│   │   ├── AppContext.tsx    # Candidate state, bookmarks, notifications & shortcuts
│   │   └── ThemeContext.tsx  # Light/Dark theme provider & persistence
│   ├── components/
│   │   ├── common/           # Button, Card, Badge, Modal, CommandPalette
│   │   └── layout/           # Header, Sidebar, AppLayout
│   ├── data/
│   │   └── seed/             # Seed JSONs (Linux, Windows, Cross-platform, Inventory)
│   ├── pages/
│   │   ├── DashboardPage.tsx     # Overview dashboard with metrics & subject cards
│   │   ├── PracticeSetupPage.tsx # Practice configuration & question pool filters
│   │   ├── MockExamPage.tsx      # Formal CDAC exam simulation launcher
│   │   ├── ActiveQuizPage.tsx    # High-priority 3-column quiz environment
│   │   ├── ResultsPage.tsx       # Detailed results & incorrect retry workflow
│   │   ├── TopicExplorerPage.tsx # Hierarchical curriculum explorer
│   │   ├── ReviewPage.tsx        # Incorrect questions & bookmarked recall hub
│   │   ├── AnalyticsPage.tsx     # Recharts analytics & weak area rankings
│   │   ├── QuestionBankPage.tsx  # Import/Export, schema validator & inspector
│   │   └── SettingsPage.tsx      # Benchmarks, profile & database maintenance
│   ├── services/
│   │   ├── analytics/        # Statistical calculations & streak formulas
│   │   ├── quiz/             # Quiz generation, shuffling & scoring engine
│   │   ├── storage/          # Repository interface & IndexedDB implementation
│   │   └── validation/       # Zod schemas & question bank import validator
│   ├── types/
│   │   └── index.ts          # Strongly typed domain models & Zod schemas
│   ├── App.tsx               # Primary application routes
│   ├── main.tsx              # Application mount point
│   └── index.css             # Semantic theme variables & accessibility rules
└── tests/
    ├── setup.ts              # Testing setup & matchers
    ├── validator.test.ts     # JSON schema validation tests
    ├── quiz-scoring.test.ts  # Scoring & distractor logic tests
    ├── analytics.test.ts     # Analytics & streak calculations tests
    └── user-journey.test.ts  # 10-step critical candidate journey E2E test
```

---

## 📝 License
Built for educational and technical certification excellence for candidates preparing for CDAC CMCE / CCEE and enterprise systems administration credentials.
