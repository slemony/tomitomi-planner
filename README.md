# tomitomi Launch Planner

An interactive brand launch planner and calendar for **tomitomi** — built with React 19 + Vite, auto-deployed to GitHub Pages via GitHub Actions, with Google Sign-In and real-time collaborative workspaces powered by Firebase.

**Live URL:** https://slemony.github.io/tomitomi-planner/

---

## Features

### Phase Management
- **Custom phases** — add as many planning phases as you need
- **Auto-sorted** — phases always display in chronological order by week or date range; reorders instantly when you edit a timeframe
- **Flexible timeframes** — set phases by week number (relative to project start) or specific calendar dates
- **Collapsible phase cards** — expand/collapse to keep the sidebar tidy
- **Edit & delete** — rename, change emoji, adjust timeframe, or remove phases at any time

### Task Management
- **Add, edit, and delete tasks** within any phase
- **Deadline badges** — colour-coded: normal / soon (≤ 3 days) / overdue
- **Flexible deadlines** — set as "N days from phase start" or a specific calendar date
- **Check off tasks** — from the sidebar or the day modal
- **Overall progress bar** — tracks completion across all phases

### Calendar
- **Phase colour bars** — each phase's date range is colour-coded directly inside each day cell
- **Phase label chips** — phase emoji + name appear on the phase's first visible day
- **Due-task indicator** — a bell icon with count appears on days with deadlines
- **Day modal** — tap any date to see active phases, due tasks (with checkboxes), notes, and milestone flag
- **Day notes & milestones** — add freeform notes or pin important dates
- **Month navigation** — previous/next arrows + "Today" button
- **Legend** — shows all phases active in the current month

### Google Sign-In & Cloud Sync
- **Google Sign-In** via redirect (works in all browsers including headless)
- **Cross-device sync** — data saved to Firestore, loads on any signed-in device
- **Offline fallback** — changes persist to localStorage instantly; Firestore syncs in the background
- **Sync indicator** — dot in the header shows syncing / synced status

### Workspace Sharing (Collaborative)
- **Invite link** — Settings → copy your invite link and share it
- **Join a workspace** — paste a link or workspace ID into Settings → Join
- **Live sync** — all members see changes within ~1 second via Firestore `onSnapshot`
- **Guest warning** — banner shows when viewing someone else's workspace
- **Return to your own** — one-click button in the header and Settings

### Mobile-Friendly
- **Bottom tab bar** — switch between Tasks and Calendar on small screens
- **Task overflow menu** — tap the `⋯` button on any task row to access Set Deadline, Edit, and Delete without cluttering the row
- **Bottom-sheet modals** — modals slide up from the bottom on mobile
- **Responsive layout** — side-by-side panels on desktop, full-screen tabs on mobile

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (live reload)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## Deploy to GitHub Pages

Every push to `main` triggers a GitHub Actions build and deploys to GitHub Pages automatically.

### First-time setup

1. Create a public GitHub repo named `tomitomi-planner`
2. Push this project:
   ```bash
   git remote add origin https://github.com/slemony/tomitomi-planner.git
   git push -u origin main
   ```
3. Go to **Settings → Pages → Source → GitHub Actions** and save
4. Visit `https://slemony.github.io/tomitomi-planner/` after ~2 minutes

---

## Firebase Setup

The Firebase config lives in `src/lib/firebase.js`.

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        !exists(/databases/$(database)/documents/workspaces/$(workspaceId)) ||
        request.auth.uid in resource.data.members ||
        request.auth.uid == resource.data.owner
      );
    }
  }
}
```

---

## Project Structure

```
src/
├── App.jsx                    # Root layout, auth guard, header, tab bar
├── main.jsx
├── index.css
├── components/
│   ├── CalendarView.jsx       # Monthly grid, phase bars, legend
│   ├── DayModal.jsx           # Day detail — notes, milestones, due tasks
│   ├── DeadlinePicker.jsx     # Inline deadline picker (days or date)
│   ├── PhaseCard.jsx          # Collapsible phase card with progress bar
│   ├── PhaseEditModal.jsx     # Add / edit phase overlay
│   ├── SettingsModal.jsx      # Brand name, start date, workspace sharing
│   ├── Sidebar.jsx            # Phase list + Add Phase button
│   └── TaskItem.jsx           # Task row with mobile overflow menu
├── context/
│   ├── AppContext.jsx         # Global state, Firebase sync, auth, workspace
│   └── useApp.js
└── lib/
    ├── defaultData.js         # Default phases
    ├── firebase.js            # Firebase initialisation
    └── utils.js               # Date helpers, phase range, deadline utils
```

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.4 | UI framework |
| react-dom | ^19.2.4 | React DOM renderer |
| firebase | ^12.10.0 | Auth + Firestore |
| lucide-react | ^0.577.0 | SVG icon library |
| vite | ^5.0.0 | Build tool |
| @vitejs/plugin-react | ^5.1.4 | React plugin for Vite |

---

## Quick Reference

| Action | How |
|--------|-----|
| Set project start date | Settings (gear icon) → enter date → Save |
| Add a phase | Tap **+ Add Phase** at the bottom of the sidebar |
| Edit a phase | Hover/tap phase → pencil icon |
| Delete a phase | Hover/tap phase → × icon |
| Add a task | **+ Add task** at the bottom of any phase |
| Edit a task | Desktop: hover → pencil icon · Mobile: ⋯ → Edit |
| Set a task deadline | Desktop: hover → clock icon · Mobile: ⋯ → Set deadline |
| Delete a task | Desktop: hover → × icon · Mobile: ⋯ → Delete |
| Check off a task | Tick the checkbox on the task row or in the day modal |
| Add a day note / milestone | Tap any calendar date |
| Get your invite link | Settings → copy Invite Link |
| Join a workspace | Settings → paste link → Join |
| Return to your workspace | "Return to my workspace" button in the header or Settings |

---

Made with love for **tomitomi**
