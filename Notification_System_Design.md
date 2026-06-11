# Stage 1

## Campus Notifications – Priority Inbox Design

### Problem Statement

The campus notification platform sends students real-time updates on **Placements**, **Results**, and **Events**. As the volume grows, users lose track of important notifications. The product manager wants a **Priority Inbox** that always surfaces the top `n` most important unread notifications first.

---

## Approach

### Priority Scoring

Each notification carries a `Type` field. Priority is determined by a **two-key sort**:

| Type      | Weight |
|-----------|--------|
| Placement | 3      |
| Result    | 2      |
| Event     | 1      |

The primary key is the **type weight** — a Placement notification always ranks above a Result, which always ranks above an Event.

The secondary (tiebreaker) key is **recency** — among notifications of equal type, more recent ones surface first.

Formally, for any two notifications A and B:

```
A > B  iff  weight(A) > weight(B)
           OR (weight(A) == weight(B) AND timestamp(A) > timestamp(B))
```

---

### Efficient Top-N Selection

New notifications keep arriving continuously. A naïve full-sort of all notifications on every update is O(M log M) — wasteful when only the top `n` matters.

**Solution: Min-Heap of size N**

We maintain a min-heap of exactly `n` elements. The heap is keyed on `(type_weight, timestamp)`. As each new notification arrives:

1. If the heap has fewer than `n` items → push directly.
2. If the heap is full:
   - Compare the new notification with the heap's minimum (least-priority item).
   - If the new notification is better → push new, pop minimum.
   - Otherwise → discard new notification.

**Complexity:**
- Time: **O(M log N)** — M = total notifications, N = top-n size
- Space: **O(N)** — only the top N are ever kept in memory

This is significantly better than O(M log M) for large streams where N << M, and allows real-time streaming ingestion without buffering all data.

---

### Handling Continuous Updates

As the spec notes — *"new notifications will keep coming in"* — the heap approach handles this naturally:

- The heap can be maintained as a persistent in-memory structure.
- Each incoming notification triggers a single O(log N) heap operation.
- No need to re-sort or re-scan existing data.

For a production microservice, this would run as:
- A background worker subscribing to a Kafka/Redis pub-sub topic.
- The heap maintained in-process (or in Redis sorted set for distributed setups).
- A `/priority-inbox?limit=n` API endpoint that reads the heap directly in O(N log N) for the final sorted output.

---

### API Integration

The notifications are fetched from:

```
GET http://4.224.186.213/evaluation-service/notifications
Authorization: Bearer <token>
```

Response shape:
```json
{
  "notifications": [
    {
      "ID": "uuid",
      "Type": "Placement | Result | Event",
      "Message": "string",
      "Timestamp": "YYYY-MM-DD HH:MM:SS"
    }
  ]
}
```

---

### Code Structure

```
stage1/
  priority_inbox.py     # Main script
  priority_output.json  # Output from last run (for screenshots)
```

**Key functions:**

- `fetch_notifications(api_key)` — hits the API, returns raw list
- `compute_priority_score(notification)` — returns `(type_weight, timestamp)` tuple
- `get_top_n_notifications(notifications, n)` — min-heap selection, O(M log N)
- `display_notifications(notifications)` — pretty terminal output
- `main(api_key, top_n)` — orchestrates fetch → rank → display → save

---

### Sample Output

```
============================================================
  TOP 10 PRIORITY NOTIFICATIONS
============================================================

  #01  [PLACEMENT]  (weight=3)
       ID      : b283218f-ea5a-4b7c-93a9-1f2f240d64b0
       Message : GFX Corporation hiring
       Time    : 2026-05-01 10:00:00

  #02  [PLACEMENT]  (weight=3)
       ID      : ...
       ...

  #05  [RESULT]  (weight=2)
       ID      : d146095a-0d86-4a34-9e69-3900a14576bc
       Message : mid-sem
       Time    : 2026-04-22 17:51:30
  ...
```

---

### Trade-offs & Alternatives

| Option | Pro | Con |
|---|---|---|
| Full sort every time | Simple | O(M log M), wastes time on old data |
| Min-heap of size N | O(M log N), streaming-friendly | Slightly more complex |
| Redis Sorted Set | Distributed, persistent | Overkill for single-node |
| SQL `ORDER BY ... LIMIT N` | Easy | Requires DB, full table scan without index |

The **min-heap** approach is the sweet spot for this use case — simple, efficient, and scales gracefully as notification volume grows.
