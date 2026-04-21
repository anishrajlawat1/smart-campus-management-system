import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import api from '../api';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const userRole = response.data.user.role;

      if (userRole === 'admin') navigate('/admin-dashboard');
      else if (userRole === 'faculty') navigate('/faculty-dashboard');
      else navigate('/student-dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl bg-white rounded-[36px] border border-slate-100 shadow-sm overflow-hidden grid lg:grid-cols-2">
        <div className="bg-slate-50 border-r border-slate-100 p-10 flex flex-col justify-between">
          <div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold mb-10"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>

            <div className="mb-10">
              <h1 className="text-3xl font-black text-indigo-600 tracking-tight italic">
                SmartCampus
              </h1>
              <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-2">
                Management System
              </p>
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Secure Access
            </p>
            <h2 className="text-5xl font-black text-slate-800 tracking-tight leading-tight mb-6">
              Welcome back to your campus portal
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Sign in as an administrator, faculty member, or student to access your
              personalized campus dashboard.
            </p>
          </div>

          <div className="space-y-4 mt-10">
            {[
              'Role-based dashboards for admin, faculty, and students',
              'Secure authentication with JWT',
              'Centralized access to all campus operations',
            ].map((item) => (
              <div
                key={item}
                className="bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-600 font-medium shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-100 text-white font-black text-2xl">
                S
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                Sign In
              </h1>
              <p className="text-slate-500 font-medium mt-2">
                Access your Smart Campus account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Institutional Email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
              >
                {loading ? 'Signing In...' : 'Sign In to Portal'}
              </button>
            </form>

            <p className="text-center mt-6 text-slate-500 font-medium">
              Don’t have an account?{' '}
              <span
                onClick={() => navigate('/register')}
                className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-700"
              >
                Register here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;