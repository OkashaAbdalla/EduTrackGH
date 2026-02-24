/**
 * Admin Login Page
 * Isolated from public login. URL must not be linked from public pages.
 * Path: /{VITE_ADMIN_LOGIN_PATH} - e.g. /secure-admin-a1b2c3d4
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateLoginForm, getRoleRedirectPath } from '../../utils/loginHelpers';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { adminLogin, user, isAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Security: if a non-admin is already logged in, never show admin login UI.
  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'admin') {
      const redirect = getRoleRedirectPath(user.role);
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await adminLogin(formData.email, formData.password);
      if (result.success) {
        showToast('Admin login successful. Redirecting...', 'success');
        setTimeout(() => navigate(ROUTES.ADMIN_DASHBOARD), 800);
      } else {
        showToast(result.message || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-[#05070c] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f2937,transparent_55%)]" />
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-teal-400/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[160px]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center px-4 py-6">
        <div className="grid w-full gap-5 rounded-[26px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
          <section className="flex h-full flex-col justify-between rounded-[20px] border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5">
            <div>
              <Link to={ROUTES.HOME} className="inline-flex items-center gap-3 text-white/90 transition hover:text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_16px_40px_rgba(16,185,129,0.4)]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  Edu<span className="text-emerald-300">Track</span> GH
                </span>
              </Link>

              <div className="mt-8 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.45em] text-emerald-200/70">Gift-Worthy Console</p>
                <h1 className="font-[Sora] text-2xl font-semibold leading-tight text-white">
                  Crafted for trust, polished for pride.
                </h1>
                <p className="text-xs leading-relaxed text-white/60">
                  A refined command space for verified administrators. Every action honors integrity, every
                  record respects accuracy.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-white/80 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[13px] font-semibold text-white/90">Audit Signature</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">Tamper-aware trails across all schools.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[13px] font-semibold text-white/90">Integrity Lens</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">Manual overrides are surfaced with clarity.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[13px] font-semibold text-white/90">Tiered Control</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">Primary and JHS guardrails enforced.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[13px] font-semibold text-white/90">Secure Session</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">Server-validated access windows.</p>
              </div>
            </div>
          </section>

          <section className="flex h-full flex-col justify-center rounded-[20px] border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.5)] lg:p-6">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90" />
                Admin Sign In
              </p>
              <h2 className="font-[Sora] text-2xl font-semibold text-white">Authorize your access</h2>
              <p className="text-xs leading-relaxed text-white/55">
                This portal is private. Use verified admin credentials only.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <FormInput
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@edutrack.gh"
                error={errors.email}
                required
              />
              <FormInput
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                error={errors.password}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_16px_38px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-60"
              >
                <span className="relative z-10">{loading ? 'Verifying...' : 'Sign In'}</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/10 via-white/40 to-white/10 transition duration-700 group-hover:translate-x-0" />
              </button>
            </form>

            <div className="mt-5 text-center text-[11px] text-white/45">
              Every session is monitored for compliance.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
