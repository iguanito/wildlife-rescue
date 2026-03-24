import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AnimalList from './pages/AnimalList';
import AnimalCreate from './pages/AnimalCreate';
import AnimalDetail from './pages/AnimalDetail';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Routes>
      {/* Public route — must be outside ProtectedRoute to avoid redirect loop */}
      <Route path="/login" element={<Login />} />

      {/* All protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/animals" replace />} />
                <Route path="/animals" element={<AnimalList />} />
                <Route path="/animals/new" element={<AnimalCreate />} />
                <Route path="/animals/:id" element={<AnimalDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
