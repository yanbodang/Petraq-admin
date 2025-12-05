import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import UserAnimals from './pages/UserAnimals';
import DataSync from './pages/DataSync';
import Organizations from './pages/Organizations';
import Settings from './pages/Settings';

function App() {
  // Use repo path as basename in production so routing works on GitHub Pages.
  const basename = import.meta.env.MODE === 'development' ? '/' : '/Petraq-admin';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="user-animals" element={<UserAnimals />} />
          <Route path="sync" element={<DataSync />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
