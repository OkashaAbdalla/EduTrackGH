# PROMPT EXECUTION START

# EduTrack GH - Production Security Hardening & Administrative Access Isolation Implementation

**Document Version:** 1.0  
**Target System:** EduTrack GH (MERN Stack - Ghana Basic Schools Absenteeism Tracker)  
**Implementation Timeline:** Phased (24-48 hours → 1 week → 2-4 weeks)

---

## 1. EXECUTIVE SECURITY ASSESSMENT

### Current Vulnerability Analysis

**Vulnerability:** Administrators use the same public login endpoint (`POST /api/auth/login`) and page (`/login`) as regular users (teachers, headteachers, parents).

**Risk Rating:** **CRITICAL**

| Risk Factor | Impact | Likelihood |
|-------------|--------|------------|
| Targeted brute force on admin accounts | Full system compromise | High |
| Credential stuffing exposure | Admin account takeover | High |
| No rate limiting differentiation | Unlimited login attempts | Certain |
| Single authentication boundary | Privilege escalation path | High |
| Audit trail gaps | Cannot distinguish attack patterns | Medium |

### Business Impact if Exploited

- **Data breach:** Student records, parent contacts, school data exfiltration
- **System manipulation:** Attendance records altered, schools/teachers created maliciously
- **Reputation damage:** Loss of trust from GES, schools, and parents
- **Regulatory non-compliance:** Data protection and audit requirements violated
- **Operational disruption:** System lockdown, recovery costs

---

## 2. PHASED IMPLEMENTATION STRATEGY

| Phase | Timeline | Focus | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1** | 24-48 hours | Immediate hardening | Hidden admin endpoint, rate limiting, admin login page |
| **Phase 2** | 1 week | Enhanced security | TOTP 2FA for admins, enrollment flow, backup codes |
| **Phase 3** | 2-4 weeks | Architectural isolation | Subdomain, IP whitelist, audit logging, session management |

---

## 3. PHASE 1 - IMMEDIATE HARDENING (CRITICAL)

### 3.1 Dependencies to Add

**File:** `eduTrackGH-backend/package.json`

Add to `dependencies`:
```json
"express-rate-limit": "^7.1.5"
```

**Command:**
```bash
cd eduTrackGH-backend && npm install express-rate-limit
```

### 3.2 Environment Variables

**File:** `eduTrackGH-backend/.env.example`

Append:
```env
# ========================================
# ADMIN ACCESS ISOLATION (Phase 1+)
# ========================================
# Hidden admin login path - generate with: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Example: /secure-admin-a1b2c3d4e5f6 (DO NOT use this in production - generate your own)
ADMIN_LOGIN_PATH=secure-admin-CHANGE_ME

# Rate limiting - requests per window
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_ADMIN_WINDOW_MS=900000
RATE_LIMIT_ADMIN_MAX=3

# Frontend: must match ADMIN_LOGIN_PATH for admin login page route
VITE_ADMIN_LOGIN_PATH=secure-admin-CHANGE_ME
```

**File:** `eduTrackGH-frontend/.env.example` (create if not exists)

```env
VITE_ADMIN_LOGIN_PATH=secure-admin-CHANGE_ME
```

### 3.3 Rate Limiting Middleware

**File:** `eduTrackGH-backend/middleware/rateLimitMiddleware.js` (NEW)

```javascript
/**
 * Rate Limiting Middleware
 * Different limits for public login vs admin login
 */

const rateLimit = require('express-rate-limit');

// Standard login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login: 3 attempts per 15 minutes per IP (stricter)
const adminLoginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX, 10) || 3,
  message: {
    success: false,
    message: 'Too many attempts. Access temporarily blocked.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, adminLoginLimiter };
```

### 3.4 Admin Login Controller Method

**File:** `eduTrackGH-backend/controllers/authController.js`

Add new function and export (insert after `login` function, before `verifyEmail`):

```javascript
/**
 * Admin-only login - MUST be called from isolated admin endpoint only.
 * Rejects non-admin users even with correct credentials.
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for administrators only.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
```

Update `module.exports`:
```javascript
module.exports = { register, login, adminLogin, verifyEmail, getMe, logout, resendVerification };
```

### 3.5 Admin Auth Routes (Isolated)

**File:** `eduTrackGH-backend/routes/adminAuthRoutes.js` (NEW)

```javascript
/**
 * Admin Authentication Routes
 * Isolated endpoint - path is configured via ADMIN_LOGIN_PATH env var.
 * Never expose this path in public documentation or UI.
 */

const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');
const { adminLoginLimiter } = require('../middleware/rateLimitMiddleware');
const { validationRules, validate } = require('../utils/validators');

router.post('/', adminLoginLimiter, validationRules.login, validate, adminLogin);

module.exports = router;
```

### 3.6 Server.js - Mount Admin Auth & Block Admin on Public Login

**File:** `eduTrackGH-backend/server.js`

Add after the existing `require` statements (around line 11):
```javascript
const { loginLimiter } = require('./middleware/rateLimitMiddleware');
```

Update auth routes section. Replace:
```javascript
app.use("/api/auth", require("./routes/authRoutes"));
```

With:
```javascript
// Apply rate limiting to public login
const authRoutes = require('./routes/authRoutes');
const authRouter = express.Router();
authRouter.post('/login', loginLimiter, require('./controllers/authController').login);
// Mount all other auth routes without login limiter (register, verify-email, etc.)
const { register, verifyEmail, getMe, logout, resendVerification } = require('./controllers/authController');
const { protect } = require('./middleware/authMiddleware');
const { validationRules, validate } = require('./utils/validators');
authRouter.post('/register', validationRules.register, validate, register);
authRouter.post('/login', loginLimiter, validate, require('./controllers/authController').login);
// ... we need to restructure - see below
```

**Simpler approach:** Modify authRoutes to add rate limiting there, and add admin route separately.

**File:** `eduTrackGH-backend/routes/authRoutes.js` (MODIFY)

Replace the entire file with:

```javascript
/**
 * Authentication Routes
 * /api/auth/*
 * Note: Admin login is on separate route - see server.js
 */

const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, getMe, logout, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validationRules, validate } = require('../utils/validators');
const { loginLimiter } = require('../middleware/rateLimitMiddleware');

// Public routes - login has rate limiting
router.post('/register', validationRules.register, validate, register);
router.post('/login', loginLimiter, validationRules.login, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
```

**File:** `eduTrackGH-backend/server.js` (MODIFY)

Add BEFORE the `app.use("/api/auth", ...)` line (admin route must be mounted FIRST so it takes precedence):

```javascript
// Admin-only login - hidden path from ADMIN_LOGIN_PATH (mount BEFORE general auth)
const adminLoginPath = process.env.ADMIN_LOGIN_PATH || 'secure-admin-default';
app.use(`/api/auth/${adminLoginPath}`, require('./routes/adminAuthRoutes'));
```

### 3.7 Block Admin Login on Public Endpoint

**File:** `eduTrackGH-backend/controllers/authController.js` (MODIFY `login` function)

Add at the start of the `login` function (after getting email/password, before User.findOne):

```javascript
// Reject admin login attempts on public endpoint - must use admin-only endpoint
const userCheck = await User.findOne({ email }).select('role');
if (userCheck && userCheck.role === 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Administrators must use the secure admin portal.',
  });
}
```

**Note:** This creates a double DB hit. Optimize by doing one find with +password and role, then check role before returning. Revised `login`:

```javascript
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // SECURITY: Block admin login on public endpoint - must use admin-only endpoint
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators must use the secure admin portal.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
```

### 3.8 Frontend - Admin Login Page

**File:** `eduTrackGH-frontend/src/pages/admin/AdminLogin.jsx` (NEW)

```jsx
/**
 * Admin Login Page
 * Isolated from public login. URL must not be linked from public pages.
 * Path: /{VITE_ADMIN_LOGIN_PATH} - e.g. /secure-admin-a1b2c3d4
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateLoginForm } from '../../utils/loginHelpers';
import authService from '../../services/authService';

const ADMIN_LOGIN_PATH = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      const result = await authService.adminLogin(formData.email, formData.password);
      if (result.success) {
        const { token, user: userData } = result;
        const role = (userData?.role || '').toLowerCase().trim();
        if (role !== 'admin') {
          showToast('Access denied. Admin credentials required.', 'error');
          setLoading(false);
          return;
        }
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', userData.email || '');
        localStorage.setItem('user_name', userData.fullName || '');
        useAuthContext.getState?.()?.setUser?.({ email: userData.email, role, name: userData.fullName });
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
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Admin Access</h2>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Secure administrator portal. Authorized personnel only.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="••••••••"
          error={errors.password}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
```

**Fix:** AdminLogin needs to use AuthContext's login - but authService.adminLogin is a different endpoint. We need authService.adminLogin and AuthContext to support it. AuthContext currently only has `login(email, password)` which calls `/auth/login`. We need:

1. `authService.adminLogin(email, password)` → `POST /api/auth/{ADMIN_LOGIN_PATH}`
2. AuthContext: add `adminLogin` or make `login` accept an optional `{ isAdmin: true }` to switch endpoint.

**Simpler:** Add `adminLogin` to AuthContext that uses authService.adminLogin and sets state. AdminLogin page calls `adminLogin` from context.

**File:** `eduTrackGH-frontend/src/services/authService.js` (MODIFY)

Add:
```javascript
adminLogin: async (credentials) => {
  const path = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
  const response = await apiClient.post(`/auth/${path}`, credentials);
  return response.data;
},
```

**File:** `eduTrackGH-frontend/src/context/AuthContext.jsx` (MODIFY)

Add `adminLogin` function:
```javascript
const adminLogin = async (email, password) => {
  try {
    const response = await authService.adminLogin({ email, password });
    if (response.success) {
      const { token, user: userData } = response;
      if (!token || !userData || userData.role?.toLowerCase() !== 'admin') {
        return { success: false, message: 'Invalid admin credentials' };
      }
      const role = 'admin';
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_email', userData.email || '');
      localStorage.setItem('user_name', userData.fullName || '');
      setUser({ email: userData.email, role, name: userData.fullName });
      setIsAuthenticated(true);
      return { success: true, user: { ...userData, role } };
    }
    return { success: false, message: response.message };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Admin login failed' };
  }
};
```

Add `adminLogin` to the value object. Update AdminLogin.jsx to use `adminLogin` from context instead of authService directly.

**File:** `eduTrackGH-frontend/src/pages/admin/AdminLogin.jsx` (REVISED)

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateLoginForm } from '../../utils/loginHelpers';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { adminLogin } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      showToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Admin Access</h2>
        <p className="text-gray-600 dark:text-gray-400 text-base">Secure administrator portal.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="admin@edutrack.gh" error={errors.email} required />
        <FormInput label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" error={errors.password} required />
        <button type="submit" disabled={loading} className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50">
          {loading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
```

### 3.9 App.jsx - Add Admin Login Route

**File:** `eduTrackGH-frontend/src/App.jsx` (MODIFY)

Add import:
```javascript
import { AdminLogin } from './pages/admin';
```

Add route (with other public routes, before protected):
```javascript
<Route path={`/${import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin'}`} element={<AdminLogin />} />
```

**File:** `eduTrackGH-frontend/src/pages/admin/index.js` (MODIFY)

Add export:
```javascript
export { default as AdminLogin } from './AdminLogin';
```

### 3.10 ProtectedRoute - Redirect Admins to Admin Login

**File:** `eduTrackGH-frontend/src/components/common/ProtectedRoute.jsx` (MODIFY)

When unauthenticated user tries to access admin route, redirect to admin login instead of public login:

```javascript
const ADMIN_LOGIN_PATH = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';

// In ProtectedRoute, when !isAuthenticated and requiredRole === 'admin':
if (!isAuthenticated && requiredRole === ROLES.ADMIN) {
  return <Navigate to={`/${ADMIN_LOGIN_PATH}`} replace />;
}
if (!isAuthenticated) {
  return <Navigate to={ROUTES.LOGIN} replace />;
}
```

### 3.11 Phase 1 Implementation Steps (Checklist)

1. Run `npm install express-rate-limit` in backend
2. Generate secure path: `node -e "console.log('secure-admin-' + require('crypto').randomBytes(8).toString('hex'))"`
3. Add env vars to backend and frontend .env
4. Create `middleware/rateLimitMiddleware.js`
5. Create `routes/adminAuthRoutes.js`
6. Modify `controllers/authController.js` (add adminLogin, block admin in login)
7. Modify `routes/authRoutes.js` (add loginLimiter)
8. Modify `server.js` (mount admin auth route)
9. Add adminLogin to authService.js
10. Add adminLogin to AuthContext.jsx
11. Create AdminLogin.jsx, add to admin index, add route in App.jsx
12. Modify ProtectedRoute for admin redirect
13. Test: public login rejects admin, admin login works at hidden path

---

## 4. PHASE 2 - ENHANCED SECURITY (SHORT-TERM)

### 4.1 Dependencies

**File:** `eduTrackGH-backend/package.json`

Add:
```json
"speakeasy": "^2.0.0",
"qrcode": "^1.5.3"
```

```bash
cd eduTrackGH-backend && npm install speakeasy qrcode
```

### 4.2 User Model - 2FA Fields

**File:** `eduTrackGH-backend/models/User.js` (MODIFY)

Add to schema (before `children`):
```javascript
// Two-factor authentication (admin only)
twoFactorSecret: { type: String, select: false },
twoFactorEnabled: { type: Boolean, default: false },
twoFactorBackupCodes: [{ type: String, select: false }],
```

### 4.3 2FA Controller

**File:** `eduTrackGH-backend/controllers/twoFactorController.js` (NEW)

```javascript
/**
 * Two-Factor Authentication Controller (Admin only)
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// Generate secret and QR for enrollment
const setup2FA = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorEnabled');
    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA already enabled' });
    }
    const secret = speakeasy.generateSecret({ name: `EduTrack GH (${user.email})`, length: 20 });
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });
    const otpauthUrl = speakeasy.otpauthURL({ secret: secret.base32, label: user.email, issuer: 'EduTrack GH', encoding: 'base32' });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    res.json({ success: true, qrCode: qrDataUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ success: false, message: '2FA setup failed' });
  }
};

// Verify and enable 2FA
const verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user || user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });
    const backupCodes = Array.from({ length: 10 }, () => require('crypto').randomBytes(4).toString('hex'));
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, backupCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: '2FA enable failed' });
  }
};

// Verify TOTP during login
const verify2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ success: false, message: 'userId and token required' });
    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes');
    if (!user || user.role !== 'admin' || !user.twoFactorEnabled) return res.status(403).json({ success: false, message: '2FA not enabled' });
    const totpValid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
    const backupValid = user.twoFactorBackupCodes?.includes(token);
    if (!totpValid && !backupValid) return res.status(400).json({ success: false, message: 'Invalid code' });
    if (backupValid) {
      user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(c => c !== token);
      await user.save({ validateBeforeSave: false });
    }
    const jwt = generateToken(user._id);
    res.json({ success: true, token: jwt, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: '2FA verification failed' });
  }
};

module.exports = { setup2FA, verifyAndEnable2FA, verify2FA };
```

### 4.4 Admin Login Flow with 2FA

Modify `adminLogin` in authController to return `requires2FA: true` and temporary token/session id when 2FA is enabled, instead of full JWT. Frontend then shows 2FA input and calls verify2FA. For simplicity, Phase 2 can use: adminLogin returns `{ requires2FA: true, tempToken }` and frontend calls `POST /api/auth/admin/verify-2fa` with tempToken + token. Simpler: adminLogin checks 2FA; if enabled, returns `requires2FA` and a signed temp token (userId, exp 5min). Frontend shows 2FA form, posts to verify2FA with that temp token + TOTP. Backend verifies temp token, verifies TOTP, returns real JWT.

**File:** `eduTrackGH-backend/controllers/authController.js` - Update adminLogin:

```javascript
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +twoFactorEnabled');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ admin2FA: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ success: true, requires2FA: true, tempToken, email: user.email });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
```

Add jwt require at top. Add verify2FA route. adminAuthRoutes: POST / for adminLogin, POST /verify-2fa for verify2FA.

### 4.5 Email Template for New Admin Login

**File:** `eduTrackGH-backend/utils/sendEmail.js` - Add template:

```javascript
adminLoginAlert: (name, email, ip, timestamp) => `
  <p>New admin login to EduTrack GH:</p>
  <p>User: ${name} (${email})</p>
  <p>IP: ${ip}</p>
  <p>Time: ${timestamp}</p>
  <p>If this was not you, secure your account immediately.</p>
`,
```

### 4.6 Database Migration Script

**File:** `eduTrackGH-backend/scripts/add2FAFields.js` (NEW)

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function migrate() {
  await connectDB();
  const result = await mongoose.connection.db.collection('users').updateMany(
    { twoFactorEnabled: { $exists: false } },
    { $set: { twoFactorEnabled: false } }
  );
  console.log('Updated', result.modifiedCount, 'users');
  process.exit(0);
}
migrate().catch(e => { console.error(e); process.exit(1); });
```

---

## 5. PHASE 3 - ARCHITECTURAL ISOLATION (LONG-TERM)

### 5.1 Admin Audit Log Model

**File:** `eduTrackGH-backend/models/AdminAuditLog.js` (NEW)

```javascript
const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

adminAuditLogSchema.index({ adminId: 1, timestamp: -1 });
adminAuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
```

### 5.2 IP Whitelist Middleware

**File:** `eduTrackGH-backend/middleware/ipWhitelistMiddleware.js` (NEW)

```javascript
/**
 * IP Whitelist for Admin Routes
 * Set ADMIN_IP_WHITELIST=1.2.3.4,5.6.7.8 (comma-separated). Empty = disabled.
 */
const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

const ipWhitelist = (req, res, next) => {
  const list = process.env.ADMIN_IP_WHITELIST;
  if (!list || list.trim() === '') return next();
  const allowed = list.split(',').map(s => s.trim()).filter(Boolean);
  const ip = getClientIp(req);
  if (allowed.includes(ip)) return next();
  res.status(403).json({ success: false, message: 'Access denied' });
};

module.exports = { ipWhitelist, getClientIp };
```

### 5.3 Shorter JWT for Admin

**File:** `eduTrackGH-backend/utils/generateToken.js` (MODIFY)

```javascript
const generateToken = (userId, options = {}) => {
  const expiresIn = options.admin ? (process.env.JWT_ADMIN_EXPIRES_IN || '2h') : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};
```

In adminLogin, use `generateToken(user._id, { admin: true })`.

### 5.4 Nginx Subdomain Config (Reference)

```nginx
# admin.edutrack.gh
server {
    listen 443 ssl;
    server_name admin.edutrack.gh;
    root /var/www/edutrack-admin;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/auth/secure-admin-xxx {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. SUPPORTING COMPONENTS

### 6.1 AuthContext - adminLogin (already in Phase 1)

### 6.2 ProtectedRoute - admin redirect (already in Phase 1)

### 6.3 Environment Variable Summary

| Variable | Phase | Description |
|----------|-------|--------------|
| ADMIN_LOGIN_PATH | 1 | Random path for admin login API |
| VITE_ADMIN_LOGIN_PATH | 1 | Same for frontend route |
| RATE_LIMIT_* | 1 | Rate limit config |
| JWT_ADMIN_EXPIRES_IN | 3 | Shorter expiry for admin tokens |
| ADMIN_IP_WHITELIST | 3 | Comma-separated IPs (optional) |

---

## 7. VALIDATION CHECKLIST

### Pre-Implementation
- [ ] MongoDB accessible
- [ ] Backend .env configured
- [ ] Frontend .env has VITE_ADMIN_LOGIN_PATH
- [ ] Secure path generated and set

### Post Phase 1
- [ ] Public /login rejects admin@edutrack.test with "use secure admin portal"
- [ ] Admin login at /{path} works for admin
- [ ] Rate limit: 6th login attempt within 15 min returns 429
- [ ] Admin login path not linked from Landing/Navbar

### Post Phase 2
- [ ] 2FA enrollment flow works
- [ ] Admin login requires TOTP when 2FA enabled
- [ ] Backup codes work once

### Post Phase 3
- [ ] Admin audit log entries created on login
- [ ] IP whitelist blocks when configured

---

## 8. RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Admins forget admin URL | Document in secure runbook; consider password manager |
| Rate limit too strict | Configurable via env; monitor 429s |
| 2FA lockout | Backup codes; admin recovery procedure |
| Breaking existing flows | Phase 1 only adds; does not remove public login for non-admins |

---

## 9. ROLLBACK PROCEDURES

**Phase 1 rollback:**
1. Remove admin route from server.js
2. Remove admin block from login in authController
3. Revert authRoutes (remove loginLimiter if causing issues)
4. Remove AdminLogin route from App.jsx
5. Admins can log in via public /login again

**Phase 2 rollback:**
1. Set twoFactorEnabled: false for admin users in DB
2. Remove 2FA routes
3. adminLogin returns token directly

---

# PROMPT EXECUTION END
