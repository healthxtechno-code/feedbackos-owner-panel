# FeedbackOS v2 — Owner Panel

A production-grade SaaS dashboard for managing healthcare feedback systems.

---

## 🏗 Project Structure

```
feedbackos-v2/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.jsx     # App shell with sidebar
│   │   ├── Sidebar.jsx    # Navigation sidebar
│   │   ├── Topbar.jsx     # Page topbar
│   │   ├── KPICard.jsx    # Dashboard metric cards
│   │   ├── HospitalCard.jsx
│   │   ├── Modal.jsx
│   │   ├── FormField.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Spinner.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/             # Route-level pages
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── HospitalsPage.jsx
│   │   ├── AddHospitalPage.jsx
│   │   ├── HospitalDetailPage.jsx
│   │   ├── ActivityLogsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── context/           # React context providers
│   │   ├── AuthContext.jsx    # Auth + token (in-memory only)
│   │   ├── ToastContext.jsx   # Global notifications
│   │   └── SettingsContext.jsx
│   ├── services/
│   │   └── api.js         # Axios API layer
│   ├── hooks/
│   │   └── useAsync.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx            # Router + providers
│   ├── main.jsx
│   └── index.css          # Global styles + Tailwind
├── backend/
│   └── Code.gs            # Google Apps Script backend
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🚀 Frontend Setup (Netlify)

### 1. Install dependencies
```bash
npm install
```

### 2. Run dev server
```bash
npm run dev
# Opens at http://localhost:3000
```

### 3. Build for production
```bash
npm run build
# Output in /dist
```

### 4. Deploy to Netlify
- Connect your GitHub repo to Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add a `_redirects` file in `/public`:
  ```
  /* /index.html 200
  ```

---

## 🔧 Backend Setup (Google Apps Script)

### 1. Create a Google Sheet
- Go to [sheets.google.com](https://sheets.google.com)
- Create a new spreadsheet
- Note the **Spreadsheet ID** from the URL:
  `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

### 2. Create Apps Script project
- Go to [script.google.com](https://script.google.com)
- Create a new project
- Paste the contents of `backend/Code.gs`

### 3. Set Script Properties
- In the Apps Script editor: **Project Settings → Script Properties**
- Or run `setupProperties()` after filling in your values:
  ```javascript
  SPREADSHEET_ID: "your-sheet-id"
  JWT_SECRET: "a-very-long-random-secret-string-at-least-32-chars"
  ```

### 4. Create initial owner account
- Fill in `OWNER_USERNAME` and `OWNER_PASSWORD` in `setupOwner()`
- Run the `setupOwner()` function **once** from the Apps Script editor
- **Delete or clear the credentials from the code afterward**

### 5. Deploy as Web App
- Click **Deploy → New Deployment**
- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone** (required for API access)
- Copy the **Web App URL**

### 6. Connect frontend to backend
- Open the Owner Panel
- Go to **Settings → Backend API**
- Paste the Web App URL
- Click **Test Connection** then **Save**

---

## 🔐 Security Notes

- **No credentials are stored in the frontend** — tokens are in-memory only
- **Passwords are SHA-256 hashed** with a secret salt before storage
- **JWT tokens** are HMAC-signed and expire after 8 hours
- **Previous password** is retained to satisfy the "last two credentials" requirement
- **No default credentials** exist anywhere in the codebase
- Always use **HTTPS** in production (Netlify enforces this automatically)

---

## 🌐 Environment & Integration

The Owner Panel connects to:
- **Admin Panel**: via `adminUrl` generated per hospital (`/admin/{hospitalId}`)
- **Patient App**: via branding data (logo, theme color, hospital image)
- **Google Sheets**: as the database via Apps Script API

---

## 📋 API Reference

All endpoints require `Authorization: Bearer <token>` header (except `/auth/login` and `/health`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| PATCH | `/auth/profile` | Update owner credentials |
| GET | `/dashboard` | KPI stats |
| GET | `/hospitals` | List hospitals |
| POST | `/hospitals` | Create hospital |
| GET | `/hospitals/:id` | Get hospital |
| PATCH | `/hospitals/:id` | Update hospital |
| PATCH | `/hospitals/:id/status` | Toggle status |
| DELETE | `/hospitals/:id` | Delete hospital |
| GET | `/logs` | Activity logs |
| GET | `/logs/export/pdf` | Export logs |
| GET | `/settings/export` | Export data |
| DELETE | `/settings/data` | Clear all data |

> **Note**: Google Apps Script Web Apps don't support custom HTTP methods (PATCH, DELETE) natively.
> The `doPatch` and `doDelete` functions above work via `doPost` with a `_method` override pattern,
> or you can use POST with a `method` body param. Adjust `api.js` accordingly for your deployment.

---

## 💡 Google Apps Script Method Override

Since GAS only supports GET and POST natively, update `api.js` to use POST with method override:

```javascript
// In api.js, replace PATCH/DELETE calls with:
patch: (url, data) => api().post(url, { ...data, _method: 'PATCH' })
delete: (url) => api().post(url, { _method: 'DELETE' })
```

And in `Code.gs`, route based on `_method` in `doPost`.
