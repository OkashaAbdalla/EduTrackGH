/**
 * Admin — GES Calendar Management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import { useToast, useCalendar, useConfirm } from '../../context';
import calendarService from '../../services/calendarService';

const TERM_OPTIONS = [
  { key: 'TERM_1', label: 'Term 1' },
  { key: 'TERM_2', label: 'Term 2' },
  { key: 'TERM_3', label: 'Term 3' },
];

const emptyHoliday = () => ({ name: '', startDate: '', endDate: '' });

/** Format stored dates as YYYY-MM-DD (UTC calendar day, matches DB storage). */
function isoInput(d) {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, '0');
  const day = String(x.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapHolidays(list) {
  const byRange = new Map();
  (list || []).forEach((h) => {
    const startDate = isoInput(h.startDate);
    const endDate = isoInput(h.endDate);
    if (!startDate || !endDate) return;
    const key = `${startDate}|${endDate}`;
    const name = (h.name || '').trim();
    const existing = byRange.get(key);
    if (!existing || (!existing.name && name)) {
      byRange.set(key, {
        name: name || existing?.name || 'Statutory / public holiday',
        startDate,
        endDate,
      });
    }
  });
  return [...byRange.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function buildEditingFromDoc(doc) {
  const termKey = doc.termKey || 'TERM_1';
  return {
    _id: doc._id,
    academicYear: doc.academicYear || '',
    termKey,
    termLabel: doc.termLabel || TERM_OPTIONS.find((o) => o.key === termKey)?.label || '',
    startDate: isoInput(doc.startDate),
    endDate: isoInput(doc.endDate),
    numberOfWeeks: doc.numberOfWeeks ?? 12,
    vacationStart: isoInput(doc.vacationStart),
    vacationEnd: isoInput(doc.vacationEnd),
    beceStart: isoInput(doc.beceStart),
    beceEnd: isoInput(doc.beceEnd),
    holidays: mapHolidays(doc.holidays),
    isActive: !!doc.isActive,
  };
}

const GesCalendarManagement = () => {
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const { refresh: refreshCalendarContext } = useCalendar();
  const [loading, setLoading] = useState(true);
  const [flat, setFlat] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const formRef = useRef(null);
  const editRequestRef = useRef(0);

  const hasYearWideOnTerm1 = flat.some(
    (r) => r.termKey === 'TERM_1' && (r.yearWideHolidays || []).length > 0
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await calendarService.listCalendars();
      if (data.success) setFlat(data.flat || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to load calendars', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = async () => {
    const ok = await requestConfirmation({
      title: 'Add term row',
      message:
        'Opens a form to add a new GES term (Term 1, 2, or 3) for an academic year — dates, vacation, and holidays.',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;

    editRequestRef.current += 1;
    setEditingLoading(false);
    setEditing({
      _id: null,
      academicYear: '',
      termKey: 'TERM_1',
      termLabel: 'Term 1',
      startDate: '',
      endDate: '',
      numberOfWeeks: 12,
      vacationStart: '',
      vacationEnd: '',
      holidays: [],
      beceStart: '',
      beceEnd: '',
      isActive: false,
    });
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openEdit = async (row) => {
    const reqId = ++editRequestRef.current;
    setEditingLoading(true);
    setEditing(null);
    try {
      const { data } = await calendarService.getCalendarById(row._id);
      if (reqId !== editRequestRef.current) return;
      if (!data?.success || !data.calendar) {
        showToast('Could not load this term', 'error');
        return;
      }
      setEditing(buildEditingFromDoc(data.calendar));
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (e) {
      if (reqId !== editRequestRef.current) return;
      showToast(e?.response?.data?.message || 'Failed to load term', 'error');
    } finally {
      if (reqId === editRequestRef.current) {
        setEditingLoading(false);
      }
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        academicYear: editing.academicYear,
        termKey: editing.termKey,
        termLabel: editing.termLabel,
        startDate: editing.startDate,
        endDate: editing.endDate,
        numberOfWeeks: Number(editing.numberOfWeeks),
        vacationStart: editing.vacationStart || undefined,
        vacationEnd: editing.vacationEnd || undefined,
        holidays: editing.holidays.filter((h) => h.startDate && h.endDate),
        beceStart: editing.termKey === 'TERM_3' && editing.beceStart ? editing.beceStart : undefined,
        beceEnd: editing.termKey === 'TERM_3' && editing.beceEnd ? editing.beceEnd : undefined,
        yearWideHolidays: editing.termKey === 'TERM_1' ? [] : undefined,
        isActive: !!editing.isActive,
      };

      if (editing._id) {
        const { data } = await calendarService.updateCalendar(editing._id, body);
        if (data.success) showToast('Calendar updated', 'success');
      } else {
        const { data } = await calendarService.createCalendar(body);
        if (data.success) showToast('Calendar row created', 'success');
      }
      setEditing(null);
      await load();
      refreshCalendarContext();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const ok = await requestConfirmation({
      title: 'Delete Calendar Row',
      message: 'Soft-delete this calendar row?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await calendarService.deleteCalendar(id);
      showToast('Removed', 'success');
      setEditing(null);
      await load();
      refreshCalendarContext();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const seed = async () => {
    const ok = await requestConfirmation({
      title: 'Seed default calendar',
      message:
        'Creates the official GES 2025/2026 calendar (3 terms) only when the database has no calendar rows. Does nothing if rows already exist.',
      confirmText: 'Seed',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      const { data } = await calendarService.seedDefault();
      if (data.success) {
        showToast(data.message || 'Seeded', 'success');
        await load();
        refreshCalendarContext();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Seed failed', 'error');
    }
  };

  const splitYearWideHolidays = async () => {
    const ok = await requestConfirmation({
      title: 'Split holidays into terms',
      message:
        'Moves year-wide statutory holidays from Term 1 into each term’s holiday list by date, then removes duplicates.',
      confirmText: 'Split',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;
    setSplitting(true);
    try {
      const { data } = await calendarService.splitYearWideHolidays();
      if (data.success) {
        showToast(data.results?.[0]?.message || data.message || 'Holidays updated', 'success');
        await load();
        refreshCalendarContext();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Split failed', 'error');
    } finally {
      setSplitting(false);
    }
  };

  const normalizeHolidayRows = async () => {
    const ok = await requestConfirmation({
      title: 'Clean up holiday rows',
      message:
        'Removes duplicate holiday rows, merges overlapping dates, and drops public holidays that fall during vacation (already covered by vacation dates).',
      confirmText: 'Clean up',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;
    setNormalizing(true);
    try {
      const { data } = await calendarService.normalizeHolidayRows();
      if (data.success) {
        const msg =
          data.results?.map((r) => r.message).filter(Boolean).join(' ') ||
          data.message ||
          'Holiday rows cleaned';
        showToast(msg, 'success');
        await load();
        refreshCalendarContext();
        if (editing?._id) {
          const { data: fresh } = await calendarService.getCalendarById(editing._id);
          if (fresh?.success && fresh.calendar) {
            setEditing(buildEditingFromDoc(fresh.calendar));
          }
        }
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Cleanup failed', 'error');
    } finally {
      setNormalizing(false);
    }
  };

  const activateYear = async (academicYear) => {
    const ok = await requestConfirmation({
      title: 'Activate academic year',
      message: `Sets ${academicYear} as the active GES calendar for attendance, registers, and marking. All other years will be deactivated.`,
      confirmText: 'Activate',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      const { data } = await calendarService.activateAcademicYear(academicYear);
      if (data.success) {
        showToast(data.message || 'Activated', 'success');
        await load();
        refreshCalendarContext();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Activation failed', 'error');
    }
  };

  const years = [...new Set(flat.map((r) => r.academicYear))].sort();
  const editingTermLabel = TERM_OPTIONS.find((o) => o.key === editing?.termKey)?.label || editing?.termLabel;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">GES Calendar</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage academic terms, holidays, and BECE window. One academic year can be active at a time.
            </p>
          </div>
          <Link
            to={ROUTES.ADMIN_DASHBOARD}
            className="text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
          >
            ← Admin home
          </Link>
        </div>

        {hasYearWideOnTerm1 && (
          <Card className="p-4 border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-950 dark:text-amber-100 mb-3">
              Statutory holidays are still stored on the Term 1 row as year-wide entries. Split them into each
              term&apos;s holiday list (by date) so Term 2 and Term 3 show their own holidays when you edit.
            </p>
            <button
              type="button"
              disabled={splitting}
              onClick={splitYearWideHolidays}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {splitting ? 'Splitting…' : 'Split holidays into terms'}
            </button>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Add term row
          </button>
          <button
            type="button"
            onClick={normalizeHolidayRows}
            disabled={normalizing || flat.length === 0}
            className="rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {normalizing ? 'Cleaning…' : 'Clean up holiday rows'}
          </button>
          <button
            type="button"
            onClick={seed}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            Seed default (empty DB only)
          </button>
        </div>

        {years.length > 0 && (
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-500 mb-2">
              Activate academic year
            </p>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => activateYear(y)}
                  className="rounded-md border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                >
                  Set active: {y}
                </button>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <p className="text-gray-600 dark:text-slate-400">Loading…</p>
        ) : (
          <Card className="overflow-x-auto table-scroll p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Term</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Weeks</th>
                  <th className="px-3 py-2">Holidays</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {flat.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{row.academicYear}</td>
                    <td className="px-3 py-2">{row.termLabel || row.termKey}</td>
                    <td className="px-3 py-2">{isoInput(row.startDate)}</td>
                    <td className="px-3 py-2">{isoInput(row.endDate)}</td>
                    <td className="px-3 py-2">{row.numberOfWeeks}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-slate-400">
                      {(row.holidays || []).length}
                      {row.termKey === 'TERM_1' && (row.yearWideHolidays || []).length > 0 && (
                        <span className="text-amber-600 dark:text-amber-400"> (+{(row.yearWideHolidays || []).length} unsplit)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        disabled={editingLoading}
                        className="text-green-700 dark:text-green-400 font-semibold hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {flat.length === 0 && (
              <p className="p-4 text-gray-600 dark:text-slate-400">No calendar rows. Seed default or add terms.</p>
            )}
          </Card>
        )}

        {editingLoading && (
          <p className="text-sm text-gray-600 dark:text-slate-400">Loading term…</p>
        )}

        {editing && !editingLoading && (
          <div ref={formRef}>
          <Card key={editing._id || `new-${editing.termKey}`} className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editing._id ? `Edit ${editingTermLabel}` : 'New term row'}
              {editing._id && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-slate-400">
                  ({editing.academicYear})
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Academic year
                <input
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.academicYear}
                  onChange={(e) => setEditing({ ...editing, academicYear: e.target.value })}
                  placeholder="2025/2026"
                  disabled={!!editing._id}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Term
                <select
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.termKey}
                  disabled={!!editing._id}
                    onChange={(e) => {
                    const opt = TERM_OPTIONS.find((o) => o.key === e.target.value);
                    setEditing({
                      ...editing,
                      termKey: e.target.value,
                      termLabel: opt?.label || '',
                      beceStart: e.target.value === 'TERM_3' ? editing.beceStart : '',
                      beceEnd: e.target.value === 'TERM_3' ? editing.beceEnd : '',
                    });
                  }}
                >
                  {TERM_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Start date
                <input
                  type="date"
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.startDate}
                  onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                End date
                <input
                  type="date"
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.endDate}
                  onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Register weeks (expected)
                <input
                  type="number"
                  min={1}
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.numberOfWeeks}
                  onChange={(e) => setEditing({ ...editing, numberOfWeeks: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 mt-6 text-sm text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                Active (prefer “Activate year” for all three terms)
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Vacation start (after term)
                <input
                  type="date"
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.vacationStart}
                  onChange={(e) => setEditing({ ...editing, vacationStart: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Vacation end
                <input
                  type="date"
                  className="ui-select ui-select-sm w-full mt-1"
                  value={editing.vacationEnd}
                  onChange={(e) => setEditing({ ...editing, vacationEnd: e.target.value })}
                />
              </label>
            </div>
            {editing.termKey === 'TERM_3' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                  BECE start (JHS3 exam window)
                  <input
                    type="date"
                    className="ui-select ui-select-sm w-full mt-1"
                    value={editing.beceStart}
                    onChange={(e) => setEditing({ ...editing, beceStart: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                  BECE end
                  <input
                    type="date"
                    className="ui-select ui-select-sm w-full mt-1"
                    value={editing.beceEnd}
                    onChange={(e) => setEditing({ ...editing, beceEnd: e.target.value })}
                  />
                </label>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-1">
                {editingTermLabel} holidays (in-school days only — vacation statutory dates are omitted)
              </p>
              {(editing.holidays || []).length === 0 && (
                <p className="text-xs text-gray-500 dark:text-slate-500 mb-2">
                  No holidays configured for this term yet.
                </p>
              )}
              {(editing.holidays || []).map((h, i) => (
                <div key={`term-h-${h.startDate}-${h.endDate}-${i}`} className="flex flex-wrap gap-2 mb-2">
                  <input
                    placeholder="Name"
                    className="flex-1 min-w-[120px] rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                    value={h.name}
                    onChange={(e) => {
                      const next = [...editing.holidays];
                      next[i] = { ...next[i], name: e.target.value };
                      setEditing({ ...editing, holidays: next });
                    }}
                  />
                  <input
                    type="date"
                    className="rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                    value={h.startDate}
                    onChange={(e) => {
                      const next = [...editing.holidays];
                      next[i] = { ...next[i], startDate: e.target.value };
                      setEditing({ ...editing, holidays: next });
                    }}
                  />
                  <input
                    type="date"
                    className="rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                    value={h.endDate}
                    onChange={(e) => {
                      const next = [...editing.holidays];
                      next[i] = { ...next[i], endDate: e.target.value };
                      setEditing({ ...editing, holidays: next });
                    }}
                  />
                  <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() => {
                      const next = editing.holidays.filter((_, j) => j !== i);
                      setEditing({ ...editing, holidays: next });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-green-700 dark:text-green-400 font-semibold"
                onClick={() => setEditing({ ...editing, holidays: [...(editing.holidays || []), emptyHoliday()] })}
              >
                + Add holiday range
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-slate-600"
              >
                Cancel
              </button>
              {editing._id && (
                <button
                  type="button"
                  onClick={() => remove(editing._id)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GesCalendarManagement;
