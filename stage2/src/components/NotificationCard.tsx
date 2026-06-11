"use client";
import {
  Paper,
  Stack,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import { Notification, TYPE_COLORS, TYPE_BG, formatTimestamp, timeAgo, markViewed } from "@/lib/notifications";

interface Props {
  notification: Notification;
  isViewed: boolean;
  onViewed: (id: string) => void;
  rank?: number;
}

const TYPE_ICONS = {
  Placement: <WorkIcon fontSize="small" />,
  Result: <SchoolIcon fontSize="small" />,
  Event: <EventIcon fontSize="small" />,
};

export default function NotificationCard({ notification, isViewed, onViewed, rank }: Props) {
  const color = TYPE_COLORS[notification.Type] ?? "#555";
  const bg = TYPE_BG[notification.Type] ?? "#f5f5f5";

  const handleMarkRead = () => {
    markViewed(notification.ID);
    onViewed(notification.ID);
  };

  return (
    <Paper
      elevation={isViewed ? 0 : 2}
      onClick={handleMarkRead}
      sx={{
        p: 2,
        borderLeft: `4px solid ${color}`,
        bgcolor: isViewed ? "#fafafa" : "#fff",
        opacity: isViewed ? 0.75 : 1,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": { transform: "translateX(2px)", boxShadow: 3 },
        position: "relative",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Rank Badge */}
        {rank !== undefined && (
          <Box
            sx={{
              minWidth: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {rank}
          </Box>
        )}

        {/* Type Icon */}
        {rank === undefined && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: bg,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {TYPE_ICONS[notification.Type]}
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
            <Chip
              label={notification.Type}
              size="small"
              sx={{
                bgcolor: bg,
                color: color,
                fontWeight: 700,
                fontSize: 11,
                border: `1px solid ${color}`,
              }}
              icon={<Box sx={{ color }}>{TYPE_ICONS[notification.Type]}</Box>}
            />
            {!isViewed && (
              <FiberManualRecordIcon sx={{ fontSize: 10, color: color }} />
            )}
          </Stack>
          <Typography
            variant="body1"
            fontWeight={isViewed ? 400 : 600}
            sx={{ wordBreak: "break-word" }}
          >
            {notification.Message}
          </Typography>
          <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(notification.Timestamp)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              · {timeAgo(notification.Timestamp)}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            ID: {notification.ID}
          </Typography>
        </Box>

        {/* Mark read button */}
        {!isViewed && (
          <Tooltip title="Mark as read">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkRead();
              }}
              sx={{ color, flexShrink: 0 }}
            >
              <MarkEmailReadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}
