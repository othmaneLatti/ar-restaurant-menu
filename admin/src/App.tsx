import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layout
import SidebarLayout from './components/layout/SidebarLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuManager from './pages/MenuManager';
import ItemEditor from './pages/ItemEditor';
import QRGenerator from './pages/QRGenerator';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<SidebarLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/menu" element={<MenuManager />} />
            <Route path="/menu/new" element={<ItemEditor />} />
            <Route path="/menu/edit/:id" element={<ItemEditor />} />
            <Route path="/qr" element={<QRGenerator />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
