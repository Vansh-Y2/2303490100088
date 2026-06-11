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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Fab,
  Tooltip,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import Link from "next/link";
import NotificationCard from "@/components/NotificationCard";
import {
  fetchNotifications,
  getViewedIds,
  markAllViewed,
  Notification,
  NotificationType,
} from "@/lib/notifications";

const TYPE_OPTIONS = ["All", "Placement", "Result", "Event"];

export default function HomePage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
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
      const params: { type?: string } = {};
      if (typeFilter !== "All") params.type = typeFilter;
      const data = await fetchNotifications(apiKey, params);
      setNotifications(data);
      setFetched(true);
      setViewedIds(getViewedIds());
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, typeFilter]);

  const handleMarkAllRead = () => {
    markAllViewed(notifications.map((n) => n.ID));
    setViewedIds(getViewedIds());
  };

  const handleViewed = (id: string) => {
    setViewedIds((prev) => new Set([...prev, id]));
  };

  const displayed =
    typeFilter === "All"
      ? notifications
      : notifications.filter((n) => n.Type === typeFilter);

  const unreadCount = displayed.filter((n) => !viewedIds.has(n.ID)).length;

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
            variant="text"
            sx={{ color: "#fff", fontWeight: 600 }}
          >
            All
          </Button>
          <Button
            component={Link}
            href="/priority"
            variant="outlined"
            startIcon={<StarIcon />}
            sx={{ color: "#ffd600", borderColor: "#ffd600" }}
          >
            Priority Inbox
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* API Key + Controls */}
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
          <FormControl size="small" sx={{ minWidth: 140, bgcolor: "#fff" }}>
            <InputLabel>Type Filter</InputLabel>
            <Select
              value={typeFilter}
              label="Type Filter"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {fetched && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {displayed.length} notification{displayed.length !== 1 ? "s" : ""}
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

        {/* Notification List */}
        <Stack spacing={1.5}>
          {displayed.length === 0 && fetched && !loading && (
            <Alert severity="info">No notifications found.</Alert>
          )}
          {displayed.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isViewed={viewedIds.has(n.ID)}
              onViewed={handleViewed}
            />
          ))}
        </Stack>
      </Container>

      {/* FAB: Priority */}
      <Tooltip title="Priority Inbox">
        <Fab
          component={Link}
          href="/priority"
          color="secondary"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <Badge badgeContent="★" color="warning">
            <StarIcon />
          </Badge>
        </Fab>
      </Tooltip>
    </Box>
  );
}
