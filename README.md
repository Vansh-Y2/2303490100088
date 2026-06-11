# Campus Notifications Microservice

## Project Structure

```
campus-notifications/
├── stage1/
│   └── priority_inbox.py          # Stage 1: Priority inbox algorithm
├── stage2/                        # Stage 2: React/Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout with MUI theme
│   │   │   ├── page.tsx           # All notifications page
│   │   │   └── priority/
│   │   │       └── page.tsx       # Priority inbox page
│   │   ├── components/
│   │   │   └── NotificationCard.tsx
│   │   └── lib/
│   │       └── notifications.ts   # Fetch, rank, utilities
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── Notification_System_Design.md  # Design document (both stages)
```

---

## Stage 1 – Priority Inbox Algorithm

### Usage

```bash
cd stage1
pip install requests
python priority_inbox.py <YOUR_API_KEY> 10
```

### How it works

- Fetches all notifications from `http://4.224.186.213/evaluation-service/notifications`
- Ranks using a **min-heap of size N** — O(M log N) time complexity
- Priority: **Placement (3) > Result (2) > Event (1)**, then by recency
- Outputs top N to terminal and saves `priority_output.json`

---

## Stage 2 – React/Next.js Frontend

### Setup & Run

```bash
cd stage2
npm install
npm run dev
```

App runs at **http://localhost:3000**

### Pages

| Route | Description |
|-------|-------------|
| `/` | All notifications with type filter |
| `/priority` | Priority inbox with top-N selector |

### Features

- Bearer token authentication (entered in UI)
- Filter notifications by type (Placement / Result / Event)
- Priority inbox with configurable top-N (5, 10, 15, 20, 25, 30)
- **New vs viewed** distinction tracked in localStorage
- Mark individual or all notifications as read
- Responsive design (desktop + mobile)
- Material UI styling only
- Color-coded by type with rank badges on priority page
- Error handling for API failures

---

## API

```
GET http://4.224.186.213/evaluation-service/notifications
Authorization: Bearer <token>

Query params (Stage 2):
  ?type=Placement|Result|Event
  ?limit=N
```
