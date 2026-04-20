/**
 * GES Calendar — admin CRUD + active calendar for authenticated users
 */

const Calendar = require("../models/Calendar");
const {
  invalidateActiveCalendarCache,
  getActiveCalendarForApi,
  getLegacyCalendarPayload,
} = require("../services/calendarRuntime");

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

const TERM_KEYS = ["TERM_1", "TERM_2", "TERM_3"];

/** GET /api/calendar/active — any authenticated user */
const getActiveCalendar = async (req, res) => {
  try {
    const data = await getActiveCalendarForApi();
    return res.json(data);
  } catch (e) {
    console.error("getActiveCalendar", e);
    return res.status(500).json({ success: false, message: "Failed to load calendar" });
  }
};

/** GET /api/calendar — admin: all entries grouped */
const listCalendars = async (req, res) => {
  try {
    const rows = await Calendar.find({ isDeleted: { $ne: true } }).sort({ academicYear: -1, termKey: 1 }).lean();
    const byYear = {};
    rows.forEach((r) => {
      if (!byYear[r.academicYear]) byYear[r.academicYear] = [];
      byYear[r.academicYear].push(r);
    });
    return res.json({ success: true, grouped: byYear, flat: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Failed to list calendars" });
  }
};

/** GET /api/calendar/:id */
const getCalendarById = async (req, res) => {
  try {
    const doc = await Calendar.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, calendar: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Failed" });
  }
};

function validateTermBody(body, isUpdate) {
  const {
    academicYear,
    termKey,
    startDate,
    endDate,
    numberOfWeeks,
    holidays,
    beceStart,
    beceEnd,
    yearWideHolidays,
  } = body;

  if (!isUpdate) {
    if (!academicYear || !termKey || !TERM_KEYS.includes(termKey))
      return "academicYear and termKey (TERM_1|TERM_2|TERM_3) are required";
    if (!startDate || !endDate) return "startDate and endDate are required";
    if (numberOfWeeks == null || Number(numberOfWeeks) < 1) return "numberOfWeeks must be >= 1";
  }

  const start = startDate != null ? toDate(startDate) : null;
  const end = endDate != null ? toDate(endDate) : null;
  if (start && end && start >= end) return "startDate must be before endDate";

  if (Array.isArray(holidays)) {
    for (const h of holidays) {
      const hs = toDate(h.startDate);
      const he = toDate(h.endDate);
      if (hs && he && hs > he) return "Each holiday: startDate must be <= endDate";
    }
  }
  if (Array.isArray(yearWideHolidays)) {
    for (const h of yearWideHolidays) {
      const hs = toDate(h.startDate);
      const he = toDate(h.endDate);
      if (hs && he && hs > he) return "Each year-wide holiday: startDate must be <= endDate";
    }
  }
  if (beceStart != null && beceEnd != null) {
    const bs = toDate(beceStart);
    const be = toDate(beceEnd);
    if (bs && be && bs > be) return "beceStart must be <= beceEnd";
  }
  return null;
}

/** POST /api/calendar */
const createCalendar = async (req, res) => {
  try {
    const err = validateTermBody(req.body, false);
    if (err) return res.status(400).json({ success: false, message: err });

    const exists = await Calendar.findOne({
      academicYear: req.body.academicYear.trim(),
      termKey: req.body.termKey,
      isDeleted: { $ne: true },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "A row for this academic year and term already exists. Use PUT to update.",
      });
    }

    const isT1 = req.body.termKey === "TERM_1";
    const doc = await Calendar.create({
      academicYear: req.body.academicYear.trim(),
      termKey: req.body.termKey,
      termLabel: req.body.termLabel || "",
      startDate: toDate(req.body.startDate),
      endDate: toDate(req.body.endDate),
      numberOfWeeks: Number(req.body.numberOfWeeks),
      vacationStart: req.body.vacationStart ? toDate(req.body.vacationStart) : undefined,
      vacationEnd: req.body.vacationEnd ? toDate(req.body.vacationEnd) : undefined,
      holidays: Array.isArray(req.body.holidays) ? req.body.holidays : [],
      beceStart: req.body.beceStart ? toDate(req.body.beceStart) : undefined,
      beceEnd: req.body.beceEnd ? toDate(req.body.beceEnd) : undefined,
      yearWideHolidays: isT1 && Array.isArray(req.body.yearWideHolidays) ? req.body.yearWideHolidays : [],
      isActive: !!req.body.isActive,
      isDeleted: false,
    });

    invalidateActiveCalendarCache();
    return res.status(201).json({ success: true, calendar: doc });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate academic year + term" });
    }
    return res.status(500).json({ success: false, message: e.message || "Create failed" });
  }
};

/** PUT /api/calendar/:id */
const updateCalendar = async (req, res) => {
  try {
    const err = validateTermBody(req.body, true);
    if (err) return res.status(400).json({ success: false, message: err });

    const doc = await Calendar.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const fields = [
      "academicYear",
      "termLabel",
      "startDate",
      "endDate",
      "numberOfWeeks",
      "vacationStart",
      "vacationEnd",
      "holidays",
      "beceStart",
      "beceEnd",
      "yearWideHolidays",
      "isActive",
    ];
    fields.forEach((f) => {
      if (req.body[f] === undefined) return;
      if (["startDate", "endDate", "vacationStart", "vacationEnd", "beceStart", "beceEnd"].includes(f)) {
        doc[f] = req.body[f] ? toDate(req.body[f]) : undefined;
      } else if (f === "numberOfWeeks") {
        doc[f] = Number(req.body[f]);
      } else if (["holidays", "yearWideHolidays"].includes(f)) {
        doc[f] = req.body[f];
      } else if (f === "academicYear") {
        doc[f] = String(req.body[f]).trim();
      } else {
        doc[f] = req.body[f];
      }
    });

    await doc.save();
    invalidateActiveCalendarCache();
    return res.json({ success: true, calendar: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Update failed" });
  }
};

/** DELETE /api/calendar/:id — soft */
const deleteCalendar = async (req, res) => {
  try {
    const doc = await Calendar.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    doc.isDeleted = true;
    doc.isActive = false;
    await doc.save();
    invalidateActiveCalendarCache();
    return res.json({ success: true, message: "Calendar entry removed" });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Delete failed" });
  }
};

/** POST /api/calendar/activate-year { academicYear } — admin */
const activateAcademicYear = async (req, res) => {
  try {
    const { academicYear } = req.body;
    if (!academicYear || !String(academicYear).trim()) {
      return res.status(400).json({ success: false, message: "academicYear is required" });
    }
    const y = String(academicYear).trim();
    await Calendar.updateMany({ isDeleted: { $ne: true } }, { $set: { isActive: false } });
    const result = await Calendar.updateMany(
      { academicYear: y, isDeleted: { $ne: true } },
      { $set: { isActive: true } }
    );
    invalidateActiveCalendarCache();
    return res.json({
      success: true,
      message: `Activated calendar for ${y}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Activation failed" });
  }
};

/** POST /api/calendar/seed-default — admin: legacy template rows (skipped if rows exist) */
const seedDefaultCalendar = async (req, res) => {
  try {
    const count = await Calendar.countDocuments({ isDeleted: { $ne: true } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "Calendar rows already exist. Delete or use activate-year instead.",
      });
    }
    const p = getLegacyCalendarPayload();
    const yearWide = (p.globalHolidayIsoList || []).map((iso) => ({
      name: "Statutory / public holiday",
      startDate: new Date(`${iso}T00:00:00.000Z`),
      endDate: new Date(`${iso}T00:00:00.000Z`),
    }));

    const docs = p.terms.map((t, idx) => ({
      academicYear: p.academicYear,
      termKey: t.name,
      termLabel: t.label,
      startDate: new Date(`${t.start}T00:00:00.000Z`),
      endDate: new Date(`${t.end}T00:00:00.000Z`),
      numberOfWeeks: t.numberOfWeeks,
      vacationStart: t.vacationStart ? new Date(`${t.vacationStart}T00:00:00.000Z`) : undefined,
      vacationEnd: t.vacationEnd ? new Date(`${t.vacationEnd}T00:00:00.000Z`) : undefined,
      holidays: [],
      yearWideHolidays: idx === 0 ? yearWide : [],
      beceStart: t.name === "TERM_3" && p.beceStart ? new Date(`${p.beceStart}T00:00:00.000Z`) : undefined,
      beceEnd: t.name === "TERM_3" && p.beceEnd ? new Date(`${p.beceEnd}T00:00:00.000Z`) : undefined,
      isActive: true,
      isDeleted: false,
    }));

    await Calendar.insertMany(docs);
    invalidateActiveCalendarCache();
    return res.status(201).json({ success: true, message: "Default GES calendar seeded", count: docs.length });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Seed failed" });
  }
};

module.exports = {
  getActiveCalendar,
  listCalendars,
  getCalendarById,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  activateAcademicYear,
  seedDefaultCalendar,
};
