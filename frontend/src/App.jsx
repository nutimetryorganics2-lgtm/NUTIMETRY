import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { 
  Phone, Mail, ArrowUpRight, Shield, Leaf
} from 'lucide-react';
import BrandLogo from './components/BrandLogo';

// Core Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import OrderModal from './components/OrderModal';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminCommandCenter from './components/AdminCommandCenter';
import FarmerDashboard from './components/FarmerDashboard';
import TrackOrder from './components/TrackOrder';
import ForgotPassword from './pages/ForgotPassword';

// Stores
import { useCartStore, useAuthStore } from './store/useStore';

const App = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { addToCart, openCart } = useCartStore();
  const { _hasHydrated } = useAuthStore();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.openCart && location.pathname !== '/login') {
      openCart();
    }
  }, [location.pathname, location.state]);

  const handleAddToCart = (product) => {
    addToCart(product);
    openCart();
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f8fafc] transition-colors duration-700 overflow-x-hidden relative">
        <div className="ambient-light ambient-light-1" />
        <div className="ambient-light ambient-light-2" />
        <Toaster position="top-center" gutter={8} toastOptions={{
          style: { borderRadius: '999px', background: '#020617', color: '#fff', fontSize: '14px', padding: '16px 32px' }
        }} />
        
        {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/farmer') && location.pathname !== '/login' && <Navbar />}
        
        <main>
          <Routes>
            <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCommandCenter />
              </ProtectedRoute>
            } />

            <Route path="/farmer/dashboard" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <OrderModal />

        {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/farmer') && location.pathname !== '/login' && (
          <footer className="bg-[#020617] text-white pt-32 pb-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="container-max relative z-10">
              <div className="grid lg:grid-cols-4 gap-20 mb-32">
                <div className="lg:col-span-2 space-y-12">
                  <div className="inline-flex items-center bg-white/95 backdrop-blur-md px-10 py-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-12 border border-white/50">
                    <BrandLogo size="md" className="!h-10" />
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[1.125rem] max-w-md font-medium">
                    {t('FooterDescription')}
                  </p>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Shield size={14} className="text-accent" /> Biotech Verified
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Safe Logistics
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-10">{t('Quick Links')}</h4>
                  <nav className="flex flex-col gap-6">
                    {['Home', 'Benefits', 'Products', 'Research'].map((item) => (
                      <button 
                        key={item}
                        onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({behavior:'smooth'})} 
                        className="text-slate-400 hover:text-white transition-all text-left text-sm font-bold group flex items-center gap-2"
                      >
                        {t(item)} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </nav>
                </div>
 
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-10">{t('Support')}</h4>
                  <nav className="flex flex-col gap-6">
                    <a href="tel:9121337792" className="text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                        <Phone size={14} />
                      </div>
                      {t('Andhra Pradesh')} : 9121337792
                    </a>
                    <a href="tel:9121337791" className="text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <Phone size={14} />
                      </div>
                      {t('Telangana')} : 9121337791
                    </a>
                    <a href="mailto:nutimetryorganics@gmail.com" className="text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                        <Mail size={14} />
                      </div>
                      nutimetryorganics@gmail.com
                    </a>
                  </nav>
                </div>
              </div>
              
              <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                <div className="flex items-center gap-10">
                   <span>© 2026 Nutimetry Organics</span>
                   <span className="hidden sm:inline text-accent">India's Poultry Intelligence</span>
                </div>
                <div className="text-center md:text-right">
                   <p>Engineered for Professional Shed Economics</p>
                </div>
              </div>
            </div>
            
            {/* Ambient Background Light */}
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px]" />
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
