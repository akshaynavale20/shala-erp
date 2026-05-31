import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/auth/LoginPage';
import ForcePasswordChangePage from './pages/auth/ForcePasswordChangePage';
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

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
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
