import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AboutPage from './AboutPage';
import DemoPage from './DemoPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
