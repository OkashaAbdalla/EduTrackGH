/**
 * Attendance date rules from system settings (marking window, grace period).
 */

function startOfUtcDay(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

function parseTimeToMinutes(timeStr, fallbackMinutes) {
  if (!timeStr || typeof timeStr !== "string") return fallbackMinutes;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallbackMinutes;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return fallbackMinutes;
  return h * 60 + min;
}

function formatTimeLabel(timeStr) {
  const m = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${suffix}`;
}

function nowUtcMinutes() {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

/**
 * @param {Date} dateOnly UTC midnight for the attendance day
 * @param {{ markingWindowStart?: string, markingWindowEnd?: string, markingDeadlineHour?: number, gracePeriodHours?: number }} settings
 */
function validateAttendanceMarkingWindow(dateOnly, settings = {}) {
  const graceHours = Number(settings.gracePeriodHours ?? 24);
  const endFallback = Number(settings.markingDeadlineHour ?? 9) * 60;
  const startMin = parseTimeToMinutes(settings.markingWindowStart, 7 * 60 + 30);
  const endMin = parseTimeToMinutes(settings.markingWindowEnd, endFallback || 9 * 60);
  const windowStart = settings.markingWindowStart || "07:30";
  const windowEnd = settings.markingWindowEnd || `${String(settings.markingDeadlineHour ?? 9).padStart(2, "0")}:00`;
  const now = new Date();
  const today = startOfUtcDay(now);
  const target = startOfUtcDay(dateOnly);

  if (target > today) {
    return { ok: false, code: "FUTURE_DATE", message: "Attendance cannot be marked for a future date." };
  }

  if (target.getTime() === today.getTime()) {
    const nowMin = nowUtcMinutes();
    if (nowMin < startMin) {
      return {
        ok: false,
        code: "WINDOW_NOT_OPEN",
        message: `Attendance for today opens at ${formatTimeLabel(windowStart)}. Please try again during the marking window (${formatTimeLabel(windowStart)} – ${formatTimeLabel(windowEnd)}).`,
      };
    }
    if (nowMin > endMin) {
      return {
        ok: false,
        code: "DEADLINE_PASSED",
        message: `Attendance for today must be marked by ${formatTimeLabel(windowEnd)} (marking window: ${formatTimeLabel(windowStart)} – ${formatTimeLabel(windowEnd)}).`,
      };
    }
    return { ok: true };
  }

  const endOfTarget = new Date(target);
  endOfTarget.setUTCHours(23, 59, 59, 999);
  const graceEnd = endOfTarget.getTime() + graceHours * 60 * 60 * 1000;
  if (now.getTime() > graceEnd) {
    return {
      ok: false,
      code: "GRACE_EXPIRED",
      message: `The grace period (${graceHours}h) for marking this date has expired.`,
    };
  }

  return { ok: true };
}

module.exports = {
  validateAttendanceMarkingWindow,
  startOfUtcDay,
  parseTimeToMinutes,
  formatTimeLabel,
};
