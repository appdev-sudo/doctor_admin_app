import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || '');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div className="flex items-center" style={{ height: '100vh', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '400px' }}>
        <div className="flex-col items-center mb-6" style={{ textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--primary)" className="mb-4" />
          <h2 className="text-2xl font-bold">Doctor Admin Portal</h2>
          <p className="text-muted mt-2">Sign in to manage bookings and nurses</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="glass-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
