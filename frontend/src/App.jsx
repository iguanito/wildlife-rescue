import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AnimalList from './pages/AnimalList';
import AnimalCreate from './pages/AnimalCreate';
import AnimalDetail from './pages/AnimalDetail';
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/animals" replace />} />
        <Route path="/animals" element={<AnimalList />} />
        <Route path="/animals/new" element={<AnimalCreate />} />
        <Route path="/animals/:id" element={<AnimalDetail />} />
      </Routes>
    </Layout>
  );
}
