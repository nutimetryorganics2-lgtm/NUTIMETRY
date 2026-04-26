import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Phone, CheckCircle2, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useStore';

const LoginDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const [loginMode, setLoginMode] = useState('farmer'); // farmer, admin
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials'); // credentials, mfa

  useEffect(() => {
    if (isOpen) document.body.classList.add('overlay-active');
    else document.body.classList.remove('overlay-active');
    return () => document.body.classList.remove('overlay-active');
  }, [isOpen]);

  useEffect(() => {
    if (loginMode === 'farmer') {
      setIsValid(phoneNumber.replace(/\D/g, '').length === 10);
    } else {
      if (step === 'credentials') {
        setIsValid(adminCreds.email.includes('@') && adminCreds.password.length >= 6);
      } else {
        setIsValid(mfaCode.length === 6);
      }
    }
  }, [phoneNumber, adminCreds, mfaCode, loginMode, step]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulating API Latency
    setTimeout(() => {
      if (loginMode === 'farmer') {
        setAuth({ name: 'Farmer Prasad', phone: phoneNumber }, 'farmer', 'mock-token-f');
        toast.success(t("Access Granted"));
        onClose();
        navigate('/farmer/dashboard');
      } else {
        if (step === 'credentials') {
          setStep('mfa');
          toast.success("Identity Verified. Enter MFA Code.");
        } else {
          setAuth({ name: 'Admin Vyshnavi', email: adminCreds.email }, 'admin', 'mock-token-a');
          toast.success(t("Admin Identity Verified"));
          onClose();
          navigate('/admin/dashboard');
        }
      }
      setLoading(false);
    }, 1200);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[100]" 
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-gray-50">
               <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button onClick={() => setLoginMode('farmer')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loginMode === 'farmer' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>FARMER</button>
                  <button onClick={() => setLoginMode('admin')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loginMode === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>ADMIN</button>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full"><X size={24} /></button>
            </div>

            <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
              <form onSubmit={handleLogin} className="space-y-8">
                <div>
                  <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mb-8">
                    {loginMode === 'farmer' ? <ShieldCheck className="text-primary" size={32} /> : <Lock className="text-primary" size={32} />}
                  </div>
                  <h2 className="text-4xl font-bold font-serif mb-4 tracking-tight">{t('Welcome back')}</h2>
                  <p className="text-gray-500 leading-relaxed">
                    {loginMode === 'farmer' ? t('FarmerDescription') : t('Admin Access Only')}
                  </p>
                </div>

                {loginMode === 'farmer' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Phone Number')}</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                      <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                        placeholder="00000 00000"
                        className="w-full pl-16 pr-12 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all text-xl font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {step === 'credentials' ? (
                      <>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                           <input 
                             type="email" 
                             value={adminCreds.email} 
                             onChange={e => setAdminCreds({...adminCreds, email: e.target.value})}
                             className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold"
                             placeholder="admin@nutimetryorganics.com"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Password</label>
                           <input 
                             type="password" 
                             value={adminCreds.password} 
                             onChange={e => setAdminCreds({...adminCreds, password: e.target.value})}
                             className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold"
                             placeholder="••••••••"
                           />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MFA Security Code</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={mfaCode} 
                          onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold text-center text-3xl tracking-[1em]"
                          placeholder="000000"
                        />
                        <p className="text-[10px] text-gray-400 text-center font-bold">Check your registered MFA device for the 6-digit code.</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  disabled={!isValid || loading}
                  className={`w-full py-6 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 transition-all haptic-press ${
                    isValid ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{loginMode === 'farmer' ? t('Access Portal') : 'Authorize Admin'} <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            </div>

            <div className="p-10 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Infrastructure hardened by ICAR-CARI Research</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LoginDrawer;
