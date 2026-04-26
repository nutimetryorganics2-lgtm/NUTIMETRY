import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError(t('Invalid email format'));
      return;
    }

    setLoading(true);
    setError('');

    // Simulated API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      toast.success(t('Recovery link sent!'));
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-12 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{t('Back to Login')}</span>
        </Link>

        <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div 
                key="request"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-8">
                   <Mail className="text-accent" size={32} />
                </div>
                <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4 tracking-tight">{t('Recover Password')}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  {t('Enter your registered email address and we will send you a secure link to reset your credentials.')}
                </p>

                <form onSubmit={handleReset} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Email Address')}</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold text-slate-900"
                      placeholder="name@farm.com"
                      required
                    />
                  </div>

                  <button
                    disabled={loading}
                    className={`w-full py-6 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                      loading ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/95'
                    }`}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                    ) : (
                      <>{t('Send Recovery Link')} <ArrowRight size={20} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                   <CheckCircle2 className="text-green-500" size={48} />
                </div>
                <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4 tracking-tight">{t('Check your Email')}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  {t('We have sent a secure password reset link to')} <br />
                  <span className="font-bold text-slate-900">{email}</span>
                </p>
                <div className="pt-4">
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    {t('Return to Login')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
