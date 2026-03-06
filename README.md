# 🐾 tomitomi Launch Planner

An interactive brand launch planner and calendar for **tomitomi** — built as a Vite/Node.js app, auto-deployed to GitHub Pages via GitHub Actions, with Google Sign-In and real-time collaborative workspaces powered by Firebase.

🌐 **Live URL:** https://slemony.github.io/tomitomi-planner/

---

## ✨ Features

### 📋 Phase Management
- **Custom phases** — add as many planning phases as you need (Brand Identity, Product Launch, etc.)
- **Edit phases** — rename, change emoji, and adjust timeframe directly from the sidebar
- **Flexible timeframes** — set phases by week number (default) or pick specific start/end dates
- **Delete phases** — remove phases you no longer need
- **Collapsible phase cards** — expand/collapse to keep the sidebar tidy

### ✅ Task Management
- **Add, edit, and delete tasks** in any phase
- **Task deadlines** — set a deadline as a number of days from start (default) or a specific calendar date (advanced)
- **Deadline badges** — each task shows a colour-coded badge: normal / soon (≤3 days) / overdue
- **Check off tasks** — tick tasks complete right from the day modal or sidebar
- **Progress bar** — tracks overall completion across all phases at a glance

### 📅 Calendar
- **Phase highlights** — each phase's date range is colour-coded on the calendar
- **Phase labels** — phase name + emoji appears on the phase's first day
- **⏰ Due pill** — if tasks have deadlines on a given date, a single `⏰ N due` pill appears on that cell (no clutter)
- **Day modal** — tap any date to see notes, milestones, active phases, tasks for that day, and "Due today" task list
- **Day notes** — add freeform notes to any calendar date
- **Milestones** — pin 📌 important dates directly on the calendar
- **Jump to phase** — tap a phase pill in the legend to jump straight to that phase's start month
- **Month navigation** — arrow buttons to step through months

### 🔐 Google Sign-In & Cloud Sync
- **Google Sign-In** — sign in with your Google account to enable cloud saving
- **Cross-device sync** — your data is saved to Firestore and loads on any device you sign into
- **Offline fallback** — changes are saved to localStorage instantly; Firestore syncs in the background
- **Sync indicator** — a small dot in the header shows syncing / synced status

### 🤝 Workspace Sharing (Collaborative)
- **Shared workspaces** — invite friends or teammates to collaborate on the same plan in real time
- **Invite link** — open ⚙️ Settings → copy your invite link and send it to anyone
- **Join a workspace** — paste an invite link (or bare workspace ID) into Settings → Join
- **Live sync** — changes by any member appear on everyone's screen within ~1 second via Firestore `onSnapshot`
- **Guest workspace warning** — Settings shows a warning when you're viewing someone else's workspace
- **Return to your own** — one-click "← Back to my own workspace" button in Settings
- **Auto-join from link** — opening an invite link while signed in automatically switches to that workspace

### 📱 Mobile-Friendly
- **Bottom tab bar** — switch between 📋 Tasks and 📅 Calendar views on small screens
- **Responsive layout** — side-by-side on desktop, tabbed on mobile

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server (live reload)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## 🚀 Deploy to GitHub Pages

Deployment is fully automated — every push to `main` triggers a GitHub Actions build and deploys to GitHub Pages.

### First-time setup

1. Create a public GitHub repo named `tomitomi-planner`
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/slemony/tomitomi-planner.git
   git push -u origin main
   ```
3. In the repo go to **Settings → Pages → Source → GitHub Actions** and click Save
4. Visit `https://slemony.github.io/tomitomi-planner/` after ~2 minutes

---

## 🔥 Firebase Setup

This app uses Firebase for authentication and real-time database. The config lives in `index.html`.

### Firestore Security Rules

In the [Firebase Console → Firestore → Rules](https://console.firebase.google.com/project/tomitomi-planner/firestore/rules), set:

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

## 📂 Project Structure

| File/Folder | Description |
|-------------|-------------|
| `index.html` | The entire app — all HTML, CSS, and JS in one file |
| `package.json` | Node.js project config & npm scripts |
| `vite.config.js` | Vite build config (sets base path for GitHub Pages) |
| `.github/workflows/deploy.yml` | GitHub Actions: auto-builds & deploys on every push to `main` |

---

## 💡 Quick Reference

| Action | How |
|--------|-----|
| Set start date | ⚙️ Settings → enter date → Save |
| Add a new phase | Tap **+ Add Phase** at the bottom of the sidebar |
| Edit a phase | Hover phase → tap ✏️ |
| Delete a phase | Hover phase → tap × |
| Add a task | Tap **+ Add task** at the bottom of any phase |
| Edit a task | Tap ✏️ next to the task |
| Set a task deadline | Tap ⏰ next to a task |
| Delete a task | Tap × next to any task |
| Add a day note / milestone | Tap any calendar date |
| See due tasks for a day | Tap a day with an ⏰ pill |
| Jump to a phase on calendar | Tap the phase pill in the legend |
| Get your invite link | ⚙️ Settings → copy the Invite Link |
| Join someone's workspace | ⚙️ Settings → paste link → Join |
| Return to your own workspace | ⚙️ Settings → ← Back to my own workspace |

---

Made with 🐾 for **tomitomi**
