# 🏛️ AI-Based Municipal Complaint & Waste Management System

## Tech Stack
- **Frontend**: Plain HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **AI**: Google Gemini API (free tier)

---

## 📁 Project Structure

```
complaint-system/
├── package.json
├── README.md
├── frontend/
│   ├── index.html              ← Login / Register page
│   ├── user-dashboard.html     ← Citizen complaint submission
│   ├── admin-dashboard.html    ← Admin management panel
│   ├── worker-dashboard.html   ← Field worker task view
│   ├── css/style.css
│   └── js/main.js
└── backend/
    ├── server.js
    ├── .env                    ← Add your keys here
    ├── models/
    │   ├── User.js
    │   └── Complaint.js
    ├── routes/
    │   ├── auth.js
    │   ├── complaints.js
    │   ├── admin.js
    │   └── worker.js
    ├── middleware/
    │   └── auth.js
    └── services/
        └── geminiAI.js
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js & MongoDB
- Download Node.js: https://nodejs.org (v18+)
- Download MongoDB: https://www.mongodb.com/try/download/community
- Start MongoDB service

### Step 2 — Get Gemini API Key (Free)
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 3 — Install Dependencies
```bash
cd complaint-system
npm install
```

### Step 4 — Configure Environment Variables
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/municipal_complaints
JWT_SECRET=any_random_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 5 — Create First Admin Account
After starting the server, use Postman or curl:
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@city.gov","password":"admin123","secretKey":"MUNICIPAL_ADMIN_2024"}'
```

### Step 6 — Start the Server
```bash
npm start
# OR for development (auto-restart):
npm run dev
```

### Step 7 — Open in Browser
Visit: http://localhost:5000

---

## 👥 User Roles

| Role | Access | How to Create |
|------|--------|---------------|
| **Citizen** | Submit & track complaints | Register on login page |
| **Field Worker** | View & update assigned tasks | Register as "Field Worker" on login page |
| **Admin** | Full access, assign workers | Use create-admin API (Step 5) |

---

## 🤖 How AI Works

1. Citizen submits a complaint with title, description, category
2. Backend sends it to **Gemini AI** with context about municipal issues
3. AI returns:
   - **Priority**: critical / high / medium / low
   - **Reason**: Why this priority was assigned
   - **Urgency Score**: 1–10
4. Admin sees complaints sorted by AI priority
5. Admin assigns the most critical ones first to workers

### Priority Rules (AI-guided):
- 🔴 **Critical**: Health hazards, sewage overflow, flooding, broken power lines
- 🟠 **High**: Overflowing garbage, blocked drains, large potholes
- 🟡 **Medium**: Missed collection, minor road issues, streetlight out
- 🟢 **Low**: Cosmetic issues, minor non-urgent complaints

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register user/worker
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Complaints (Citizen)
- `POST /api/complaints` — Submit complaint (multipart form with photos)
- `GET /api/complaints/my` — Get my complaints
- `GET /api/complaints/:id` — Get complaint details

### Admin
- `GET /api/admin/complaints` — All complaints (filterable)
- `GET /api/admin/workers` — All workers
- `PUT /api/admin/complaints/:id/assign` — Assign to worker
- `PUT /api/admin/complaints/:id/status` — Update status
- `GET /api/admin/stats` — Dashboard statistics

### Worker
- `GET /api/worker/complaints` — My assigned tasks
- `PUT /api/worker/complaints/:id/status` — Update task status
