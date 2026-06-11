"""
Campus Notifications - Priority Inbox (Stage 1)
Fetches notifications from the API and returns the top N most important
unread notifications based on type weight and recency.

Priority weights: Placement (3) > Result (2) > Event (1)
Recency: More recent notifications are ranked higher among same-weight items.
"""

import requests
import json
from datetime import datetime
from typing import Optional

API_URL = "http://4.224.186.213/evaluation-service/notifications"

# Type weights: higher = more important
TYPE_WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1,
}


def fetch_notifications(api_key: str) -> list[dict]:
    """Fetch all notifications from the API."""
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.get(API_URL, headers=headers, timeout=10)
    response.raise_for_status()
    data = response.json()
    return data.get("notifications", [])


def parse_timestamp(ts: str) -> datetime:
    """Parse a timestamp string to a datetime object."""
    try:
        return datetime.fromisoformat(ts)
    except ValueError:
        # Fallback for other formats
        return datetime.min


def compute_priority_score(notification: dict) -> tuple:
    """
    Compute a priority score for sorting.
    Returns a tuple (type_weight, timestamp) for lexicographic sort.
    Higher is better, so we return negated values for desc sort.
    """
    type_weight = TYPE_WEIGHTS.get(notification.get("Type", ""), 0)
    timestamp = parse_timestamp(notification.get("Timestamp", ""))
    return (type_weight, timestamp)


def get_top_n_notifications(notifications: list[dict], n: int = 10) -> list[dict]:
    """
    Return the top N notifications sorted by:
    1. Type priority (Placement > Result > Event)
    2. Recency (more recent first, as tiebreaker)

    This approach uses a min-heap of size N to efficiently maintain
    the top N notifications as new ones stream in — O(M log N) time,
    where M is total notifications. This is efficient for large streams.
    """
    import heapq

    # Use a min-heap of size N
    # Each element: (type_weight, timestamp, original_dict)
    # We use a min-heap so we can efficiently evict the least important item.
    heap = []

    for i, notif in enumerate(notifications):
        type_weight = TYPE_WEIGHTS.get(notif.get("Type", ""), 0)
        timestamp = parse_timestamp(notif.get("Timestamp", ""))
        # heap item: (type_weight, timestamp, index, notif)
        # index is used to break ties deterministically
        item = (type_weight, timestamp, i, notif)

        if len(heap) < n:
            heapq.heappush(heap, item)
        else:
            # Push new item and pop the smallest (least priority)
            heapq.heappushpop(heap, item)

    # Sort the result: highest priority first
    top_n = sorted(heap, key=lambda x: (x[0], x[1]), reverse=True)
    return [item[3] for item in top_n]


def display_notifications(notifications: list[dict]) -> None:
    """Pretty-print the priority notifications."""
    print(f"\n{'='*60}")
    print(f"  TOP {len(notifications)} PRIORITY NOTIFICATIONS")
    print(f"{'='*60}\n")

    for rank, notif in enumerate(notifications, start=1):
        type_label = notif.get("Type", "Unknown")
        weight = TYPE_WEIGHTS.get(type_label, 0)
        print(f"  #{rank:02d}  [{type_label.upper()}]  (weight={weight})")
        print(f"       ID      : {notif.get('ID', 'N/A')}")
        print(f"       Message : {notif.get('Message', 'N/A')}")
        print(f"       Time    : {notif.get('Timestamp', 'N/A')}")
        print()


def main(api_key: str, top_n: int = 10):
    print(f"Fetching notifications from API...")
    notifications = fetch_notifications(api_key)
    print(f"Total notifications received: {len(notifications)}")

    top_notifications = get_top_n_notifications(notifications, n=top_n)
    display_notifications(top_notifications)

    # Also save to JSON for screenshot/reference
    output = {
        "total_fetched": len(notifications),
        "top_n": top_n,
        "priority_notifications": top_notifications,
    }
    with open("priority_output.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"Output saved to priority_output.json")

    return top_notifications


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python priority_inbox.py <API_KEY> [top_n]")
        print("Example: python priority_inbox.py mytoken123 10")
        sys.exit(1)

    api_key = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    main(api_key, top_n)
