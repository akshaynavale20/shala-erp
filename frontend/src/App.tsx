import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/auth.store';
import { unitApi } from './api/client';

// ── Eager: tiny shell components only ────────────────────────────────────────
import AppLayout from './components/layout/AppLayout';

// ── Lazy: every page is its own chunk ────────────────────────────────────────
const LoginPage              = lazy(() => import('./pages/auth/LoginPage'));
const ForcePasswordChangePage = lazy(() => import('./pages/auth/ForcePasswordChangePage'));
const OnboardingPage         = lazy(() => import('./pages/onboarding/OnboardingPage'));
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'));
const SetupPage              = lazy(() => import('./pages/setup/SetupPage'));
const StudentsPage           = lazy(() => import('./pages/students/StudentsPage'));
const StaffPage              = lazy(() => import('./pages/staff/StaffPage'));
const AttendancePage         = lazy(() => import('./pages/attendance/AttendancePage'));
const ExamsPage              = lazy(() => import('./pages/exams/ExamsPage'));
const FeesPage               = lazy(() => import('./pages/fees/FeesPage'));
const SalaryPage             = lazy(() => import('./pages/salary/SalaryPage'));
const CertificatesPage       = lazy(() => import('./pages/certificates/CertificatesPage'));
const ReportsPage            = lazy(() => import('./pages/reports/ReportsPage'));
const AccountsPage           = lazy(() => import('./pages/accounts/AccountsPage'));
const TimetablePage          = lazy(() => import('./pages/timetable/TimetablePage'));
const LibraryPage            = lazy(() => import('./pages/library/LibraryPage'));
const ClassesPage            = lazy(() => import('./pages/classes/ClassesPage'));
const UsersPage              = lazy(() => import('./pages/users/UsersPage'));
const ContactPage            = lazy(() => import('./pages/contact/ContactPage'));
const VerifyPage             = lazy(() => import('./pages/verify/VerifyPage'));

// ── Page-level loading spinner ────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Spin size="large" tip="लोड होत आहे..." />
    </div>
  );
}

// ── Protected route — checks auth then checks if onboarding is complete ───────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setChecking(false);
      return;
    }
    if (location.pathname === '/onboarding') {
      setChecking(false);
      return;
    }
    unitApi.findBySanstha(user!.sansthaId)
      .then((units: any[]) => {
        if (!units || units.length === 0) {
          navigate('/onboarding', { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [location.pathname]);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (checking) return <PageSpinner />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ForcePasswordChangePage />} />
          <Route path="/verify/receipt/:receiptNumber" element={<VerifyPage />} />

          {/* Onboarding — protected but outside AppLayout */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<DashboardPage />} />
            <Route path="setup"        element={<SetupPage />} />
            <Route path="students"     element={<StudentsPage />} />
            <Route path="staff"        element={<StaffPage />} />
            <Route path="attendance"   element={<AttendancePage />} />
            <Route path="exams"        element={<ExamsPage />} />
            <Route path="fees"         element={<FeesPage />} />
            <Route path="salary"       element={<SalaryPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="reports"      element={<ReportsPage />} />
            <Route path="accounts"     element={<AccountsPage />} />
            <Route path="timetable"    element={<TimetablePage />} />
            <Route path="library"      element={<LibraryPage />} />
            <Route path="classes"      element={<ClassesPage />} />
            <Route path="users"        element={<UsersPage />} />
            <Route path="contact"      element={<ContactPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
