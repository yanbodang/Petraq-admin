import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import PetraQDashboard from './pages/PetraQDashboard';
import FamiliesPage from './pages/FamiliesPage';
import UsersAndMembersPage from './pages/UsersAndMembersPage';
import PetsDevicesPage from './pages/PetsDevicesPage';
import PetMedicalPage from './pages/PetMedicalPage';
import ConsentCenterPage from './pages/ConsentCenterPage';
import OperationsAuditPage from './pages/OperationsAuditPage';
import PetraQSettingsPage from './pages/PetraQSettingsPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './auth/AuthContext';

function ProtectedLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <MainLayout />;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  // Use repo path as basename in production so routing works on GitHub Pages.
  // If deploying to GitHub Pages, the basename should match your repository name
  // For example, if repo is 'petraq-admin', basename should be '/petraq-admin'
  // You can also set it via environment variable VITE_BASE_PATH
  const configuredBasePath = import.meta.env.VITE_BASE_PATH || '/Petraq-admin';
  const basename = import.meta.env.MODE === 'development'
    ? '/'
    : configuredBasePath.replace(/\/+$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          )}
        />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PetraQDashboard />} />
          <Route path="families" element={<FamiliesPage />} />
          <Route path="users" element={<UsersAndMembersPage />} />
          <Route path="pets-devices" element={<PetsDevicesPage />} />
          <Route path="medical" element={<PetMedicalPage />} />
          <Route path="consent" element={<ConsentCenterPage />} />
          <Route path="operations" element={<OperationsAuditPage />} />
          <Route path="settings" element={<PetraQSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
