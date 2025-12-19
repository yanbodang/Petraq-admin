import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import UserAnimals from './pages/UserAnimals';
import DataSync from './pages/DataSync';
import Organizations from './pages/Organizations';
import Settings from './pages/Settings';
import DeviceManagement from './pages/DeviceManagement';
import MedicalRecords from './pages/MedicalRecords';
import Reports from './pages/Reports';
import AITipsManagement from './pages/AITipsManagement';

function App() {
  // Use repo path as basename in production so routing works on GitHub Pages.
  // If deploying to GitHub Pages, the basename should match your repository name
  // For example, if repo is 'petraq-admin', basename should be '/petraq-admin'
  // You can also set it via environment variable VITE_BASE_PATH
  const basename = import.meta.env.MODE === 'development' 
    ? '/' 
    : (import.meta.env.VITE_BASE_PATH || '/petraq-admin');

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="user-animals" element={<UserAnimals />} />
          <Route path="devices" element={<DeviceManagement />} />
          <Route path="medical-records" element={<MedicalRecords />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-tips" element={<AITipsManagement />} />
          <Route path="sync" element={<DataSync />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
