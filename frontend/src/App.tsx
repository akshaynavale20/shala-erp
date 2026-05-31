import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/auth.store';
import { unitApi } from './api/client';
import LoginPage from './pages/auth/LoginPage';
import ForcePasswordChangePage from './pages/auth/ForcePasswordChangePage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import AppLayout from './components/layout/AppLayout';
import SetupPage from './pages/setup/SetupPage';
import StaffPage from './pages/staff/StaffPage';
import StudentsPage from './pages/students/StudentsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ExamsPage from './pages/exams/ExamsPage';
import FeesPage from './pages/fees/FeesPage';
import SalaryPage from './pages/salary/SalaryPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ReportsPage from './pages/reports/ReportsPage';
import AccountsPage from './pages/accounts/AccountsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import LibraryPage from './pages/library/LibraryPage';
import ClassesPage from './pages/classes/ClassesPage';
import UsersPage from './pages/users/UsersPage';
import ContactPage from './pages/contact/ContactPage';
import VerifyPage from './pages/verify/VerifyPage';

// Protected route — checks auth then checks if onboarding is complete
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
    // Skip onboarding check if already on /onboarding
    if (location.pathname === '/onboarding') {
      setChecking(false);
      return;
    }
    // Check if sanstha has at least one unit configured
    unitApi.findBySanstha(user!.sansthaId)
      .then((units: any[]) => {
        if (!units || units.length === 0) {
          navigate('/onboarding', { replace: true });
        }
      })
      .catch(() => {
        // On error, let them through — don't block on network failure
      })
      .finally(() => setChecking(false));
  }, [location.pathname]);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" tip="लोड होत आहे..." />
      </div>
    );
  }
  return <>{children}</>;
}


export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
