import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset successfully. You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '450px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h3 className="fw-bolder" style={{ color: '#D6536D' }}>Reset Password</h3>
            <p className="text-muted small">
              {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email.'}
            </p>
          </div>
          
          {error && <div className="alert alert-danger p-2 text-center small fw-bold">{error}</div>}
          {message && <div className="alert alert-success p-2 text-center small fw-bold">{message}</div>}
          
          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <div className="form-floating mb-4">
                <input type="email" required className="form-control bg-light border-0 shadow-none" id="floatingEmail" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ borderRadius: '10px' }} />
                <label htmlFor="floatingEmail" className="text-muted">Email address</label>
              </div>
              <button type="submit" disabled={loading} className="btn w-100 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#D6536D', borderRadius: '10px' }}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-floating mb-3">
                <input type="text" required className="form-control bg-light border-0 shadow-none" id="floatingOtp" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} style={{ borderRadius: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }} />
                <label htmlFor="floatingOtp" className="text-muted">6-Digit Code</label>
              </div>
              <div className="form-floating mb-4">
                <input type="password" required className="form-control bg-light border-0 shadow-none" id="floatingNewPassword" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ borderRadius: '10px' }} />
                <label htmlFor="floatingNewPassword" className="text-muted">New Password</label>
              </div>
              <button type="submit" disabled={loading} className="btn w-100 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#D6536D', borderRadius: '10px' }}>
                {loading ? 'Resetting...' : 'Change Password'}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <button type="button" className="btn btn-link text-decoration-none p-0 m-0 text-muted small" onClick={() => navigate('/login')}>
              <i className="fa fa-arrow-left me-2"></i>Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
