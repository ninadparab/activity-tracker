# 🌟 Family Activity Tracker

A web app that helps families track and rotate kids' activities — books, board games, STEM toys, art, outdoor play, and classes. Built so nothing gathers dust for months.

## What it does

- **Smart recommendations** — suggests 3 activities each day based on how long it's been since each was done, its importance, and category balance across the week
- **Neglect alerts** — highlights anything overdue so forgotten board games and books don't stay forgotten
- **Activity logging** — one tap to log a completed activity, synced to Google Sheets
- **Barcode scanning** — scan a book's ISBN barcode to auto-fill title, author, and cover image
- **Photo identification** — photograph a toy or game box and Claude Vision identifies it
- **Multi-user** — Dad and Mom can both log activities; Daughter has read-only access
- **PIN protected** — family PIN required to open the app

## Tech stack

| Layer | Technology |
|---|---|
| Database | Google Sheets |
| Backend API | Google Apps Script |
| Frontend | React + Vite |
| Hosting | GitHub Pages |
| Barcode scanning | BarcodeDetector API + ZXing |
| Book lookup | Google Books API + Open Library |
| Photo identification | Claude Vision (Anthropic) |
| Event scraping | KCLS + ParentMap |

## Project structure

```
family-activity-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploys to GitHub Pages on push
├── src/
│   ├── components/
│   │   ├── ActivityForm.jsx    # Add / edit activity form with scanner
│   │   └── Scanner.jsx         # Barcode + photo identification
│   ├── pages/
│   │   ├── Today.jsx           # Daily picks + overdue alerts
│   │   ├── Activities.jsx      # Full activity database
│   │   ├── Dashboard.jsx       # Stats, charts, streaks
│   │   └── Events.jsx          # KCLS + ParentMap events
│   ├── App.jsx                 # App shell, routing, shared state
│   ├── api.js                  # All API calls (Apps Script, Google Books, Claude)
│   ├── config.js               # Environment variable references
│   └── main.jsx                # React entry point
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## Google Sheets structure

The backend is a Google Sheet with 5 tabs:

| Sheet | Purpose |
|---|---|
| Activities | Master database of all books, toys, games, classes |
| Logs | Every logged activity with date and user |
| Events | Cached KCLS + ParentMap events, refreshed daily |
| Config | App settings (family name, users) |
| Categories | Category names, icons, colors |

## Recommendation algorithm

Each activity is scored every time recommendations are requested:

```
Score = Importance × RecencyRatio × CategoryBalanceFactor

RecencyRatio     = daysSinceDone / idealFrequencyDays
CategoryBalance  = penalizes categories over-represented in last 7 days
```

Top 3 picks are chosen with guaranteed category diversity — at least 2 different categories always appear.

## How to use this repository

This repo contains no hardcoded secrets. To run your own instance:

### 1. Set up Google Sheets

- Create a new Google Sheet
- Open **Extensions → Apps Script**
- Paste the contents of `Code.gs` (not in this repo — see setup instructions)
- Run `s1_Activities` through `s7_SampleData_Part2` one at a time to create sheet structure
- Set your access token: Apps Script editor → ⚙️ Project Settings → Script Properties → add `ACCESS_TOKEN` with any secret string
- Deploy as Web App: **Deploy → New deployment → Web App → Execute as Me → Anyone → Deploy**
- Copy the Web App URL

### 2. Get API keys

- **Anthropic API key** — sign up at [console.anthropic.com](https://console.anthropic.com) (used only for photo identification of toys and games)
- **Apps Script URL** — from step 1 above

### 3. Fork and configure

```bash
git clone https://github.com/ninadparab/activity-tracker
cd activity-tracker
npm install
```

Create `.env.local` for local development:
```
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_ANTHROPIC_KEY=sk-ant-YOUR_KEY
VITE_ACCESS_TOKEN=your-access-token
VITE_APP_PIN=your-family-pin
```

Add the same four values as **GitHub Secrets** (Settings → Secrets → Actions):
- `VITE_API_URL`
- `VITE_ANTHROPIC_KEY`
- `VITE_ACCESS_TOKEN`
- `VITE_APP_PIN`

Update `vite.config.js` base path to match your repo name:
```javascript
base: '/your-repo-name/'
```

Update `App.jsx` basename to match:
```javascript
<BrowserRouter basename="/your-repo-name">
```

### 4. Deploy

Enable GitHub Pages: repo **Settings → Pages → Source: GitHub Actions**

Push to `main` — GitHub Actions builds and deploys automatically. Your app will be live at:
```
https://YOUR_USERNAME.github.io/activity-tracker
```

### 5. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173/family-activity-tracker/`

## Editing activity data

The Google Sheet is the source of truth. You can edit it directly:

- **Add rows** to the Activities sheet — use a unique `id` like `act_19`, `act_20`
- **Never change existing `id` values** — this would break the activity's log history
- **Category must match exactly**: `Books`, `Board Games`, `Construction/STEM Toys`, `Classes`, `Outdoor`, `Art`
- Changes appear in the app immediately on next load — no rebuild needed

## Security model

| What | How it's protected |
|---|---|
| Web app URL | Family PIN required to open |
| Google Sheet API | Access token required on every API call, validated server-side |
| API keys | GitHub Secrets only — never in source code |
| Google Sheet itself | Private to your Google account |
| Repo | Public code, zero hardcoded secrets |


## Built with

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Google Apps Script](https://developers.google.com/apps-script)
- [Anthropic Claude](https://anthropic.com)
- [ZXing barcode library](https://github.com/zxing-js/library)
- [Open Library API](https://openlibrary.org/developers/api)
- [Google Books API](https://developers.google.com/books)
