# CLAUDE.md — tomitomi-planner

Guidance for AI assistants working in this repository.

---

## Project Overview

**tomitomi-planner** is a React 19 single-page app for planning product launches. It provides phase-based task management, a monthly calendar view, Firebase real-time collaboration, and workspace sharing via invite links.

- **Live URL**: https://slemony.github.io/tomitomi-planner/
- **Deployment**: Auto-deploys to GitHub Pages on every push to `main`
- **Auth**: Google Sign-In via Firebase Auth
- **Database**: Firestore (real-time) + localStorage fallback

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + JSX |
| Build tool | Vite 5 |
| Backend | Firebase 12 (Auth + Firestore) |
| Icons | lucide-react |
| Styling | Plain CSS with custom properties |
| Deployment | GitHub Actions → GitHub Pages |
| Language | JavaScript (no TypeScript) |

No CSS-in-JS, no Tailwind, no state management library, no test framework.

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Build to dist/
npm run preview   # Preview production build locally
```

The Vite dev server supports Hot Module Replacement — JSX/CSS changes reflect immediately without a full reload.

---

## Directory Structure

```
tomitomi-planner/
├── .github/
│   └── workflows/deploy.yml     # GitHub Actions: build → GitHub Pages
├── src/
│   ├── main.jsx                 # Entry point; wraps app in <AppProvider>
│   ├── App.jsx                  # Root: auth guard, header, tab bar, views
│   ├── index.css                # All styles (~940 lines, CSS variables + layout)
│   ├── components/
│   │   ├── CalendarView.jsx     # Monthly grid with phase bars + day click
│   │   ├── DayModal.jsx         # Day detail: notes, milestone, due tasks
│   │   ├── DeadlinePicker.jsx   # Toggle between "N days" or calendar date
│   │   ├── FocusModal.jsx       # Full-screen focus overlay: free timer + Pomodoro
│   │   ├── PhaseCard.jsx        # Collapsible phase card with progress bar + time total
│   │   ├── PhaseEditModal.jsx   # Add / edit phase overlay
│   │   ├── SettingsModal.jsx    # Brand name, start date, workspace sharing
│   │   ├── Sidebar.jsx          # Phase list + completion % + grand total time
│   │   └── TaskItem.jsx         # Task row: checkbox, time badge, focus, deadline, edit, delete
│   ├── context/
│   │   ├── AppContext.jsx       # Global state, auth, Firebase sync, timer + focus actions
│   │   └── useApp.js            # useContext(AppContext) hook
│   └── lib/
│       ├── defaultData.js       # 6 pre-configured launch phases + tasks
│       ├── firebase.js          # Firebase init; exports auth + db
│       └── utils.js             # Date, phase, deadline, task utilities
├── index.html                   # HTML shell; mounts #root
├── vite.config.js               # base: '/tomitomi-planner/', React plugin
├── package.json
└── README.md                    # User-facing feature docs + Firebase setup
```

---

## Architecture

### State Management

All global state lives in `AppContext.jsx`. Access it with the `useApp()` hook — never import AppContext directly.

```jsx
import { useApp } from '../context/useApp';

const { appState, updateState, user, phases, syncStatus } = useApp();
```

**`appState` shape:**
```js
{
  brandName: string,       // Displayed in header
  startDate: string,       // ISO date "YYYY-MM-DD"
  phases: Phase[],         // Sorted chronologically by actual date range
  completedTasks: {        // { [taskId]: boolean }
    [taskId]: boolean
  },
  dayNotes: {              // { [YYYY-MM-DD]: { note, milestone } }
    [isoDate]: { note: string, milestone: boolean }
  },
  openPhases: {            // { [phaseId]: boolean } — collapse state
    [phaseId]: boolean
  },
  activeTimer: null | {    // Currently running timer (persisted, survives reload)
    taskId: string,
    phaseId: string,
    startedAt: number      // Date.now() timestamp
  }
}
```

`focusMode` (which task is shown in Focus Mode) is a **local `useState`** in `AppContext` — it is UI-only and not persisted to Firestore or localStorage.

`updateState` accepts a partial object or updater function:
```jsx
updateState({ brandName: 'New Name' });
updateState(prev => ({ ...prev, openPhases: { ...prev.openPhases, [id]: true } }));
```

### Data Models

**Phase:**
```js
{
  id: string,           // uid() — e.g. "t_1234567890_abc"
  emoji: string,        // e.g. "🎨"
  name: string,
  color: string,        // Hex — used for phase bar/badge
  light: string,        // Lighter hex — used for backgrounds
  // Week-based (weekStart/weekEnd take priority):
  weekStart: number,    // 1-indexed week from startDate
  weekEnd: number,
  // Date-based (alternative to week-based):
  useDates: boolean,
  dateStart: string,    // "YYYY-MM-DD"
  dateEnd: string,
  tasks: Task[]
}
```

**Task:**
```js
{
  id: string,           // uid()
  text: string,
  deadline: string | undefined,   // "YYYY-MM-DD" or undefined
  duration: number | undefined,   // Days from startDate (alternative to deadline)
  timeEntries: TimeEntry[]        // default: [] — grows as time is logged
}
```

**TimeEntry:**
```js
{
  id:      string,                      // uid()
  date:    string,                      // "YYYY-MM-DD" — the day work happened
  minutes: number,                      // total minutes logged
  note:    string,                      // free-text (empty string if none)
  source:  'timer' | 'manual' | 'pomodoro'
}
```

### Persistence & Sync

1. **localStorage** (`tomitomi_v1`): primary offline store, always written on state change.
2. **Firestore** (`workspaces/{wsId}`): synced with a 1000ms debounce. Real-time updates via `onSnapshot`.
3. **Workspace ID** stored in localStorage (`tomitomi_wsId`).
4. Workspace sharing: invite links use `?join=wsId` query param.

### Auth Flow

```
App loads
  → Firebase onAuthStateChanged fires
  → If signed out → show SignInOverlay
  → If signed in → loadWorkspace(user.uid) → onSnapshot listener → render app
  → If ?join=wsId in URL → joinWorkspace(wsId) before loading own workspace
```

---

## Component Reference

| Component | Responsibility |
|---|---|
| `App.jsx` | Auth guard, header (brand input, progress bar, sync dot), tab bar, routes between Sidebar and CalendarView; renders `<FocusModal>` when `focusMode` is set |
| `Sidebar.jsx` | Lists `<PhaseCard>` for each phase, overall completion %, grand total logged time, Add Phase button |
| `PhaseCard.jsx` | Collapsible card: emoji, name, timeframe, progress bar, per-phase total logged time, task list via `<TaskItem>`, edit/delete controls |
| `TaskItem.jsx` | Checkbox, text, time badge (logged hours), deadline badge; desktop hover → 4 action buttons (▶ Focus, ⏰ Deadline, ✏ Edit, ✕ Delete); mobile → ⋯ dropdown with Focus & Timer + Log time; expandable time log panel + manual entry form |
| `FocusModal.jsx` | Full-screen dark overlay: free timer (count up) or Pomodoro mode (25 min countdown, auto-logs sessions, short/long breaks); updates `document.title` during timer; Pause/Skip/Reset controls |
| `DeadlinePicker.jsx` | Inline picker: toggle "Days" (duration) vs "Date" (calendar); auto-focuses on mount |
| `CalendarView.jsx` | 6×7 grid; prev/next month nav; cells show phase bars, due task count, notes, milestone star; click → DayModal |
| `DayModal.jsx` | Overlay for a day: active phase tags, due tasks with checkboxes, note textarea, milestone toggle, clear button |
| `PhaseEditModal.jsx` | Add or edit a phase: emoji, name, color, week or date range |
| `SettingsModal.jsx` | Brand name, start date, workspace invite link generation, reset, sign out |

---

## Utility Functions (`src/lib/utils.js`)

| Function | Signature | Description |
|---|---|---|
| `toISO` | `(y, m, d) => string` | Year + 0-indexed month + day → `"YYYY-MM-DD"` |
| `fromISO` | `(str) => Date` | `"YYYY-MM-DD"` → Date (local time, no UTC shift) |
| `fmtDate` | `(str) => string` | `"YYYY-MM-DD"` → `"Mon D"` |
| `fmtDeadlineBadge` | `(task) => string` | Returns human label for deadline badge |
| `phaseRange` | `(phase, startDate) => { s, e } \| null` | Resolves phase start/end as Date objects |
| `phaseFirstVisible` | `(phase, viewY, viewM, startDate) => Date \| null` | First visible day of phase in a given month |
| `phasesOnDate` | `(iso, phases, startDate) => Phase[]` | All phases active on a given date |
| `totalTasks` | `(phases) => number` | Total task count across all phases |
| `doneTasks` | `(completedTasks) => number` | Count of completed tasks |
| `getDeadlineClass` | `(task) => string` | Returns CSS class: `overdue`, `soon`, or `''` |
| `getTaskDeadlineDate` | `(task, phase, startDate) => Date \| null` | Resolves task deadline to a Date |
| `getTasksWithDeadlineOn` | `(iso, phases, startDate) => {task, phase}[]` | Tasks due on a specific date |
| `getTaskLoggedMin` | `(task, activeTimer) => number` | Total minutes logged for a task, including live running timer |
| `fmtDuration` | `(totalMin) => string` | Minutes → `"1h 30m"`, `"45m"`, `"2h"`, or `""` |
| `uid` | `() => string` | Generates `"t_{timestamp}_{random}"` IDs |

---

## AppContext Actions

All actions are available via `useApp()`. Original actions (`updateState`, `signInWithGoogle`, `signOutUser`, `switchToOwnWorkspace`, `joinWorkspace`, `resetAll`) are unchanged. New additions:

| Action | Signature | Description |
|---|---|---|
| `startTimer` | `(phaseId, taskId)` | Starts a new `activeTimer`; auto-saves any previously running timer (≥ 1 min) as a `'timer'` entry first |
| `stopTimer` | `(note?)` | Saves elapsed time as a `'timer'` entry (if ≥ 1 min), clears `activeTimer` |
| `addTimeEntry` | `(phaseId, taskId, entry)` | Appends a `TimeEntry` to a task (used for manual and pomodoro entries) |
| `deleteTimeEntry` | `(phaseId, taskId, entryId)` | Removes a `TimeEntry` from a task |
| `enterFocus` | `(phaseId, taskId)` | Sets local `focusMode` state → triggers `<FocusModal>` render in `App.jsx` |
| `exitFocus` | `()` | Clears `focusMode` |

`focusMode` (exposed from context): `null` or `{ phaseId, taskId }`.

### Timer lifecycle in Focus Mode

| Mode | On open | On complete session | On close |
|------|---------|---------------------|----------|
| Free timer | `startTimer` called | — | `stopTimer('')` saves elapsed time |
| Pomodoro | `startTimer` called; on switch from free, `stopTimer` saves partial free time | `addTimeEntry` logs exactly 25 min per session | `exitFocus()` only — sessions already logged |
| Switch free→pomo | `stopTimer('')` saves partial free time | | |
| Switch pomo→free | `startTimer` restarts fresh | | `stopTimer('')` saves elapsed |

---

## Styling System

All styles are in `src/index.css`. No external CSS framework.

### CSS Custom Properties (`:root`)

```css
--bg: #fdf8f4        /* Off-white page background */
--card: #ffffff      /* Card/panel surfaces */
--text: #2d2416      /* Primary dark-brown text */
--muted: #7a6651     /* Secondary/helper text */
--border: #e8d9c5    /* Borders and dividers */
--accent: #e84a8a    /* Pink — primary CTA, active states */
--p1 … --p6         /* Phase colors (hex) */
--p1l … --p6l       /* Phase light variants (hex) */
--tab-h: 58px        /* Mobile tab bar height */
--header-h: 52px     /* Sticky header height */
```

### Layout

- **Desktop**: sticky header → `flex-row` (sidebar 300px + calendar fills remaining space)
- **Mobile**: sticky header + sticky bottom tab bar (Tasks / Calendar tabs); views are full-width and stack vertically

### Naming Conventions (CSS)

- Component containers: `.phase-card`, `.task-list`, `.cal-grid`
- Utility classes: `.t-btn` (base button), `.t-icon-btn` (icon-only button)
- State modifiers: `.overdue`, `.soon`, `.done`, `.open`
- Mobile-only visibility: `.t-more-btn` shown on mobile, hidden on desktop via media query

---

## Coding Conventions

### Files & Naming

- Components: **PascalCase** files and function names (`PhaseCard.jsx`)
- Utilities/hooks: **camelCase** (`useApp.js`, `utils.js`)
- CSS classes: **kebab-case** (`phase-card`, `t-btn`)
- IDs/state keys: **camelCase** (`taskId`, `openPhases`)

### Component Pattern

```jsx
import { useApp } from '../context/useApp';

export default function MyComponent({ prop }) {
  const { appState, updateState } = useApp();
  // hooks at top
  // handlers as const functions
  // return JSX
}
```

- Functional components only — no class components
- Hooks always at the top of the component body
- Conditional rendering uses ternaries (`condition ? <A /> : <B />`) — no `if` in JSX
- No inline styles except for dynamic CSS variable values (e.g., `style={{ color: phase.color }}`)

### State Updates

Always spread to avoid mutation:
```jsx
// Add a task to a phase
updateState(prev => ({
  ...prev,
  phases: prev.phases.map(p =>
    p.id === phaseId ? { ...p, tasks: [...p.tasks, newTask] } : p
  )
}));
```

### IDs

Use `uid()` from `src/lib/utils.js` for all new entity IDs:
```js
import { uid } from '../lib/utils';
const newTask = { id: uid(), text: '', ... };
```

### No Linting Config

There is no ESLint or Prettier config. Follow the existing code style by observation:
- 2-space indentation
- Single quotes for strings
- Semicolons omitted (rely on ASI)
- Arrow functions for callbacks

---

## Testing

**There is no test suite.** No jest, no Vitest, no React Testing Library, no test files. Validate changes by running the dev server (`npm run dev`) and testing in the browser.

If adding tests, use **Vitest** (already compatible with Vite) + **@testing-library/react**.

---

## CI/CD & Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Checkout repo
2. `npm ci`
3. `npm run build` → outputs to `dist/`
4. Upload `dist/` as GitHub Pages artifact
5. Deploy to `https://slemony.github.io/tomitomi-planner/`

**Vite base URL** is `/tomitomi-planner/` (set in `vite.config.js`) — required for asset paths to resolve correctly on the GitHub Pages subpath. Do not change this.

---

## Common Tasks

### Add a new component

1. Create `src/components/MyComponent.jsx`
2. Use `useApp()` for global state; accept props for local concerns
3. Import and render in the appropriate parent component

### Add a utility function

Add to `src/lib/utils.js` and export. Import with:
```js
import { myUtil } from '../lib/utils';
```

### Add a new phase field

1. Update the `Phase` data model in any new phases you create (`uid()` for id)
2. Update `defaultData.js` if the field should be in the default dataset
3. Update `AppContext.jsx` normalization logic if sorting/filtering depends on the field
4. Update `PhaseEditModal.jsx` so users can set the field
5. Update `utils.js` if `phaseRange` or related helpers need to handle the field

### Modify Firebase structure

The Firestore document for each workspace is at `workspaces/{wsId}`. The document stores the entire `appState` object. Any new top-level keys added to `appState` are automatically persisted — no schema migration needed. Be mindful that existing workspaces won't have the new key until next save.

---

## Firebase Configuration

Defined in `src/lib/firebase.js`. Exports:
- `auth` — Firebase Auth instance
- `db` — Firestore instance

The Firebase project is `tomitomi-planner` (public config, safe to commit). Security rules are documented in `README.md` — only authenticated users can read/write their own workspace documents.
