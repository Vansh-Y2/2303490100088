"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  Slider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import Link from "next/link";
import NotificationCard from "@/components/NotificationCard";
import {
  fetchNotifications,
  getTopNNotifications,
  getViewedIds,
  markAllViewed,
  Notification,
} from "@/lib/notifications";

export default function PriorityPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [topN, setTopN] = useState(10);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    setViewedIds(getViewedIds());
  }, []);

  const load = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotifications(apiKey);
      const top = getTopNNotifications(data, topN);
      setNotifications(top);
      setFetched(true);
      setViewedIds(getViewedIds());
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, topN]);

  const handleMarkAllRead = () => {
    markAllViewed(notifications.map((n) => n.ID));
    setViewedIds(getViewedIds());
  };

  const handleViewed = (id: string) => {
    setViewedIds((prev) => new Set([...prev, id]));
  };

  const unreadCount = notifications.filter((n) => !viewedIds.has(n.ID)).length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "#1a237e", borderBottom: "1px solid #283593" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <NotificationsIcon sx={{ color: "#ffd600" }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Campus Notifications
          </Typography>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
          >
            All
          </Button>
          <Button
            component={Link}
            href="/priority"
            variant="contained"
            startIcon={<StarIcon />}
            sx={{ bgcolor: "#ffd600", color: "#1a237e", fontWeight: 700 }}
          >
            Priority Inbox
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
            color: "#fff",
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
            <StarIcon sx={{ color: "#ffd600" }} />
            <Typography variant="h5" fontWeight={700}>
              Priority Inbox
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Shows the top <strong>{topN}</strong> most important unread notifications, ranked by
            type priority (Placement &gt; Result &gt; Event) and recency.
          </Typography>
        </Paper>

        {/* Controls */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
          <TextField
            label="API Key (Bearer Token)"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, bgcolor: "#fff", borderRadius: 1 }}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <FormControl size="small" sx={{ minWidth: 100, bgcolor: "#fff" }}>
            <InputLabel>Top N</InputLabel>
            <Select
              value={topN}
              label="Top N"
              onChange={(e) => setTopN(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 25, 30].map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={load}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            sx={{ bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" } }}
          >
            {loading ? "Loading..." : "Fetch"}
          </Button>
        </Stack>

        {/* Priority legend */}
        <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
            Priority order:
          </Typography>
          {[
            { label: "Placement", color: "#1976d2", bg: "#e3f2fd" },
            { label: "Result", color: "#388e3c", bg: "#e8f5e9" },
            { label: "Event", color: "#f57c00", bg: "#fff3e0" },
          ].map((t, i) => (
            <Chip
              key={t.label}
              label={`${i + 1}. ${t.label}`}
              size="small"
              sx={{
                bgcolor: t.bg,
                color: t.color,
                fontWeight: 600,
                border: `1px solid ${t.color}`,
              }}
            />
          ))}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {fetched && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Showing top {notifications.length} notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} unread`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Mark all as read
              </Button>
            )}
          </Stack>
        )}

        {/* Priority Notification List */}
        <Stack spacing={1.5}>
          {notifications.length === 0 && fetched && !loading && (
            <Alert severity="info">No notifications found.</Alert>
          )}
          {notifications.map((n, idx) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isViewed={viewedIds.has(n.ID)}
              onViewed={handleViewed}
              rank={idx + 1}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
