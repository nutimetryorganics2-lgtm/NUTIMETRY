import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, 
  AlertCircle, ChevronLeft, Phone, User, MapPin, Leaf
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { authService } from '../services/api';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role: currentRole, setAuth } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Get the intended destination from location state or query params
  const from = location.state?.from || new URLSearchParams(location.search).get('next') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (currentRole === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [isAuthenticated, currentRole, navigate, from]);

  // Login State
  const [loginId, setLoginId] = useState(''); // phone or email
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    village: '',
    district: '',
    state: '',
    address: '',
    pincode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId || loginPassword.length < 6) {
      setError(t('Please enter valid credentials. Password must be 6+ chars.'));
      return;
    }

    setLoading(true);
    setError('');

    const isEmail = loginId.includes('@');
    const payload = {
      password: loginPassword,
      ...(isEmail ? { email: loginId } : { phone: loginId })
    };

    try {
      const response = await authService.login(payload);
      const { token, role, user: userData } = response.data;
      
      setAuth(userData, role, token);
      toast.success(t('Welcome back, ') + (userData.name || 'Admin'));
      
      // Production-grade redirect logic
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Preserve openCart state if redirected from checkout
        const openCart = location.state?.openCart;
        navigate(from, { 
          replace: true, 
          state: { openCart } 
        });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // FastAPI validation error array
        setError(detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', '));
      } else {
        setError(detail || t('Invalid credentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.phone.length !== 10) {
      setError(t('Please enter a valid 10-digit phone number.'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('Password must be at least 6 characters.'));
      return;
    }
    
    const requiredFields = ['name', 'village', 'district', 'state', 'address', 'pincode'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(t('All fields are required.'));
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.register(formData);
      const { token, role, user: userData } = response.data;
      
      setAuth(userData, role, token);
      
      toast.success(t('Account created! Welcome, ') + userData.name);
      
      const openCart = location.state?.openCart;
      navigate(from, { 
        replace: true, 
        state: { openCart } 
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', '));
      } else {
        setError(detail || t('Registration failed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col md:flex-row overflow-hidden">
      {/* Branding Side */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative p-16 flex-col justify-between overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-white/5 rounded-full blur-3xl" 
        />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-start"
        >
          <Link to="/" className="inline-flex items-center gap-3 text-white/60 hover:text-white transition-colors mb-12 group shrink-0">
             <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-sm font-bold uppercase tracking-widest">{t('Back to Site')}</span>
          </Link>
          
          <div className="inline-flex items-center bg-white/95 backdrop-blur-md px-12 py-8 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.1)] mb-16 border border-white/50">
            <BrandLogo size="lg" className="!h-14" />
          </div>
          <p className="text-white/70 text-xl max-w-md leading-relaxed font-semibold">
            {t('LoginDescription', { defaultValue: 'Secure access to your poultry intelligence dashboard. Farmers log in via phone, Administrators via email.' })}
          </p>

        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-12 pt-10">
            <h2 className="text-slate-900 mb-6 tracking-tight">{t('Welcome')}</h2>
            
            {/* Mode Switcher */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10">
              <button 
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-white text-primary shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('Login')}
              </button>
              <button 
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-white text-primary shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('Register')}
              </button>
            </div>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium mb-6">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Phone or Email')}</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" size={22} />
                    <input 
                      type="text" 
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="premium-input-luxury pl-16 pr-6 py-6 text-lg"
                      placeholder="6301XXXXXX or admin@..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Password')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" size={22} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="premium-input-luxury pl-16 pr-16 py-6"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-luxury w-full py-7 text-xl mt-8 shadow-2xl"
                >
                  {loading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-4">{t('Sign In')} <ArrowRight size={24} /></div>}
                </button>
                <div className="text-center">
                   <Link to="/forgot-password" size={14} className="text-xs font-black text-slate-400 hover:text-primary transition-all uppercase tracking-widest">{t('Forgot password?')}</Link>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Full Name')}</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleRegisterChange}
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                      placeholder="Your Name" required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Phone')}</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" name="phone" value={formData.phone} onChange={handleRegisterChange}
                        className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                        placeholder="10-digit" required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Password')}</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleRegisterChange}
                        className="w-full pl-10 pr-10 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                        placeholder="••••••" required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Village')}</label>
                    <input 
                      type="text" name="village" value={formData.village} onChange={handleRegisterChange}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                      placeholder="e.g., Nidumolu" required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('District')}</label>
                    <input 
                      type="text" name="district" value={formData.district} onChange={handleRegisterChange}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                      placeholder="e.g., Krishna" required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('State')}</label>
                    <input 
                      type="text" name="state" value={formData.state} onChange={handleRegisterChange}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                      placeholder="Andhra Pradesh" required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Pincode')}</label>
                    <input 
                      type="text" name="pincode" value={formData.pincode} onChange={handleRegisterChange}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900"
                      placeholder="521156" required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Full Address Details')}</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                    <textarea 
                      name="address" value={formData.address} onChange={handleRegisterChange}
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-slate-900 min-h-[100px]"
                      placeholder="Street, Landmark, etc." required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 mt-4 bg-accent text-white rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-accent/20 hover:bg-accent/95 transition-all"
                >
                  {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('Create Farmer Profile')} <ArrowRight size={20} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
