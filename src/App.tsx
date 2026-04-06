import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import UserAnimals from './pages/UserAnimals';
import DataSync from './pages/DataSync';
import Organizations from './pages/Organizations';
import Settings from './pages/Settings';
import DeviceManagement from './pages/DeviceManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import MedicalRecords from './pages/MedicalRecords';
import Reports from './pages/Reports';
import AITipsManagement from './pages/AITipsManagement';
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
  const basename = import.meta.env.MODE === 'development' 
    ? '/' 
    : (import.meta.env.VITE_BASE_PATH || '/Petraq-admin');

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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="user-animals" element={<UserAnimals />} />
          <Route path="devices" element={<DeviceManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="medical-records" element={<MedicalRecords />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-tips" element={<AITipsManagement />} />
          <Route path="sync" element={<DataSync />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
