import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function Signup() {
  const [formData, setFormData] = useState({
    organizationName: '', industry: '',
    name: '', email: '', password: '', confirmPassword: '', role: 'ORG_ADMIN'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loginUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        role: formData.role
      });
      
      // Auto-login after signup
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      }, { withCredentials: true });
      
      loginUser(loginRes.data.user, loginRes.data.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h3 className="mb-4 fw-bold text-center" style={{ color: '#D6536D' }}>Register Your Company</h3>
          
          {error && <div className="alert alert-danger p-2">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <h5 className="mb-3 text-muted border-bottom pb-2">Workspace Details</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Company Name</label>
                <input type="text" required className="form-control" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Industry</label>
                <input type="text" className="form-control" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
              </div>
            </div>
            
            <h5 className="mb-3 text-muted border-bottom pb-2">Admin User Details</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input type="text" required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email Address</label>
                <input type="email" required className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" required className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Confirm Password</label>
                <input type="password" required className="form-control" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn w-100 fw-bold text-white" style={{ backgroundColor: '#D6536D' }}>
              {loading ? 'Creating...' : 'Create Company Account'}
            </button>
            <div className="text-center mt-3">
              <span className="text-muted small">Already have an account? </span>
              <button type="button" className="btn btn-link text-decoration-none fw-bold p-0 m-0 align-baseline small" onClick={() => navigate('/login')} style={{ color: '#D6536D' }}>
                Login here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
