# 🐾 tomitomi Launch Planner

An interactive brand launch planner and calendar for **tomitomi** — built as a Node.js/Vite app, auto-deployed to GitHub Pages via GitHub Actions.

🌐 **Live URL:** https://slemony.github.io/tomitomi-planner/

---

## ✨ Features

- **Interactive calendar** — click any date to add notes & pin milestones 📌
- **Phase labels on calendar** — each phase's name + emoji appears on its start date
- **Phase task list in day view** — clicking a calendar date shows the active phases and all their tasks, with checkboxes you can tick off right there
- **Editable task list** — add, edit, and delete tasks in any phase
- **Adjustable week ranges** — change when each phase starts and ends, updates calendar automatically
- **Tap legend pills** to jump straight to that phase's start month on the calendar
- **Mobile-friendly** — bottom tab bar to switch between Tasks and Calendar views
- **Progress bar** — tracks your overall completion at a glance
- **Saves automatically** — everything saved in your browser, no account needed

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

### Step 1 — Create the GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Set **Repository name** to: `tomitomi-planner`
3. Set it to **Public**
4. **Do NOT** check "Add a README file" (we already have one)
5. Click **Create repository**

### Step 2 — Push from your terminal

Open a terminal in this project folder and run:

```bash
git init
git checkout -b main
git add .
git commit -m "Initial commit: tomitomi planner"
git remote add origin https://github.com/slemony/tomitomi-planner.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages (GitHub Actions)

1. In your repo, go to **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **GitHub Actions**
3. Click **Save**

### Step 4 — Your site is live! 🎉

GitHub will automatically build and deploy every time you push to `main`.

After the first push, wait ~2 minutes then visit:
```
https://slemony.github.io/tomitomi-planner/
```

You can watch the deployment progress under the **Actions** tab in your repo.

---

## 📂 Project Structure

| File/Folder | Description |
|-------------|-------------|
| `index.html` | The entire app — all HTML, CSS, and JS |
| `package.json` | Node.js project config & npm scripts |
| `vite.config.js` | Vite build config (sets base path for GitHub Pages) |
| `.github/workflows/deploy.yml` | GitHub Actions: auto-builds & deploys on every push to main |
| `.gitignore` | Ignores node_modules and build output |

---

## 💡 How to Use

| Action | How |
|--------|-----|
| Set start date | Tap ⚙️ → enter date → Save |
| View phases on calendar | Phases auto-appear as coloured labels once start date is set |
| Edit a task | Tap ✏️ next to any task |
| Add a task | Tap **+ Add task** at the bottom of any phase |
| Delete a task | Tap × next to any task |
| Add a note to a day | Tap any calendar date |
| Mark a milestone | Tap a date → check the 📌 milestone box |
| Jump to a phase | Tap a phase pill in the legend above the calendar |
| Switch views (mobile) | Use the **📋 Tasks** / **📅 Calendar** tabs at the bottom |

---

Made with 🐾 for **tomitomi**
