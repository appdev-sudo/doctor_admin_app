import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Overview from './pages/Overview';
import Nurses from './pages/Nurses';
import Bookings from './pages/Bookings';
import Subscriptions from './pages/Subscriptions';
import ArchivedRecords from './pages/ArchivedRecords';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="nurses" element={<Nurses />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="archives" element={<ArchivedRecords />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
