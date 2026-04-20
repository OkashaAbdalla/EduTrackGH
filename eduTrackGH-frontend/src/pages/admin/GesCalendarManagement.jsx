/**
 * Admin — GES Calendar Management
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import { useToast, useCalendar } from '../../context';
import calendarService from '../../services/calendarService';

const TERM_OPTIONS = [
  { key: 'TERM_1', label: 'Term 1' },
  { key: 'TERM_2', label: 'Term 2' },
  { key: 'TERM_3', label: 'Term 3' },
];

const emptyHoliday = () => ({ name: '', startDate: '', endDate: '' });

function isoInput(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
}

const GesCalendarManagement = () => {
  const { showToast } = useToast();
  const { refresh: refreshCalendarContext } = useCalendar();
  const [loading, setLoading] = useState(true);
  const [flat, setFlat] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const openNew = () => {
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
      yearWideHolidays: [],
      isActive: false,
    });
  };

  const openEdit = (row) => {
    setEditing({
      ...row,
      startDate: isoInput(row.startDate),
      endDate: isoInput(row.endDate),
      vacationStart: isoInput(row.vacationStart),
      vacationEnd: isoInput(row.vacationEnd),
      beceStart: isoInput(row.beceStart),
      beceEnd: isoInput(row.beceEnd),
      holidays: (row.holidays || []).map((h) => ({
        name: h.name || '',
        startDate: isoInput(h.startDate),
        endDate: isoInput(h.endDate),
      })),
      yearWideHolidays: (row.yearWideHolidays || []).map((h) => ({
        name: h.name || '',
        startDate: isoInput(h.startDate),
        endDate: isoInput(h.endDate),
      })),
    });
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
        yearWideHolidays:
          editing.termKey === 'TERM_1'
            ? editing.yearWideHolidays.filter((h) => h.startDate && h.endDate)
            : undefined,
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
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Soft-delete this calendar row?')) return;
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

  const activateYear = async (academicYear) => {
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GES Calendar</h1>
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
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Term</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Weeks</th>
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
                    <td className="px-3 py-2">{row.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="text-green-700 dark:text-green-400 font-semibold hover:underline"
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

        {editing && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editing._id ? 'Edit term' : 'New term row'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Academic year
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                  value={editing.academicYear}
                  onChange={(e) => setEditing({ ...editing, academicYear: e.target.value })}
                  placeholder="2025/2026"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Term
                <select
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                  value={editing.termKey}
                  onChange={(e) => {
                    const opt = TERM_OPTIONS.find((o) => o.key === e.target.value);
                    setEditing({ ...editing, termKey: e.target.value, termLabel: opt?.label || '' });
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
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                  value={editing.startDate}
                  onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                End date
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                  value={editing.endDate}
                  onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Register weeks (expected)
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
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
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                  value={editing.vacationStart}
                  onChange={(e) => setEditing({ ...editing, vacationStart: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                Vacation end
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
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
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                    value={editing.beceStart}
                    onChange={(e) => setEditing({ ...editing, beceStart: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">
                  BECE end
                  <input
                    type="date"
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                    value={editing.beceEnd}
                    onChange={(e) => setEditing({ ...editing, beceEnd: e.target.value })}
                  />
                </label>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-1">Term holidays (ranges)</p>
              {(editing.holidays || []).map((h, i) => (
                <div key={i} className="flex flex-wrap gap-2 mb-2">
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

            {editing.termKey === 'TERM_1' && (
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-1">
                  Year-wide holidays (statutory — applies to all terms)
                </p>
                {(editing.yearWideHolidays || []).map((h, i) => (
                  <div key={i} className="flex flex-wrap gap-2 mb-2">
                    <input
                      placeholder="Name"
                      className="flex-1 min-w-[120px] rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                      value={h.name}
                      onChange={(e) => {
                        const next = [...editing.yearWideHolidays];
                        next[i] = { ...next[i], name: e.target.value };
                        setEditing({ ...editing, yearWideHolidays: next });
                      }}
                    />
                    <input
                      type="date"
                      className="rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                      value={h.startDate}
                      onChange={(e) => {
                        const next = [...editing.yearWideHolidays];
                        next[i] = { ...next[i], startDate: e.target.value };
                        setEditing({ ...editing, yearWideHolidays: next });
                      }}
                    />
                    <input
                      type="date"
                      className="rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                      value={h.endDate}
                      onChange={(e) => {
                        const next = [...editing.yearWideHolidays];
                        next[i] = { ...next[i], endDate: e.target.value };
                        setEditing({ ...editing, yearWideHolidays: next });
                      }}
                    />
                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => {
                        const next = editing.yearWideHolidays.filter((_, j) => j !== i);
                        setEditing({ ...editing, yearWideHolidays: next });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-green-700 dark:text-green-400 font-semibold"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      yearWideHolidays: [...(editing.yearWideHolidays || []), emptyHoliday()],
                    })
                  }
                >
                  + Add year-wide holiday
                </button>
              </div>
            )}

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
        )}
      </div>
    </DashboardLayout>
  );
};

export default GesCalendarManagement;
