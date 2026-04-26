import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingCart, 
  Phone, User, MessageSquare, Leaf
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useAuthStore, useCartStore } from '../store/useStore';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
      <button 
        onClick={() => i18n.changeLanguage('en')}
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-500 ${i18n.language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
      >
        EN
      </button>
      <button 
        onClick={() => i18n.changeLanguage('te')}
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-500 ${i18n.language === 'te' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
      >
        తెలుగు
      </button>
    </div>
  );
};

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const { getCartCount, openCart } = useCartStore();
    
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
    
  const cartCount = getCartCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sections = ['home', 'benefits', 'products', 'research', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home', type: 'scroll' },
    { name: 'Benefits', id: 'benefits', type: 'scroll' },
    { name: 'Products', id: 'products', type: 'scroll' },
    { name: 'Research', id: 'research', type: 'scroll' },
    { name: 'Track Order', id: 'track', type: 'link' },
    { name: 'Contact', id: 'contact', type: 'scroll' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-4' : 'py-10'}`}
    >
      <div className="container-max">
        <div className={`glass-island flex items-center justify-between px-6 py-4 transition-all duration-1000 ${isScrolled ? 'bg-white/90 border-slate-200/50 shadow-xl' : 'bg-white/40 border-transparent shadow-none'}`}>
          
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center group shrink-0 mr-4">
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
          </Link>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-3 xl:gap-4 flex-nowrap">
            {navLinks.map((link) => (
              link.type === 'link' ? (
                <Link 
                  key={link.id}
                  to={`/${link.id}`}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-500 relative py-1 ${location.pathname === `/${link.id}` ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                >
                  {t(link.name)}
                </Link>
              ) : (
                <button 
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-500 relative py-1 ${activeSection === link.id && location.pathname === '/' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                >
                  {t(link.name)}
                  {activeSection === link.id && location.pathname === '/' && (
                    <motion.div layoutId="navDot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                  )}
                </button>
              )
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <div className="hidden lg:flex items-center gap-2 pr-2 border-r border-slate-200">
               <LanguageSwitcher />
               <a href="tel:9121337792" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all duration-500" title="Call Us">
                 <Phone size={18} strokeWidth={2.5} />
               </a>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={openCart} className="relative w-10 h-10 flex items-center justify-center text-primary hover:bg-slate-50 rounded-full transition-all duration-500">
                <ShoppingCart size={20} strokeWidth={2.5} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <Link 
                  to={role === 'admin' ? "/admin/dashboard" : "/farmer/dashboard"}
                  className="hidden md:flex btn-luxury !py-2.5 !px-4 text-[12px] uppercase tracking-wider whitespace-nowrap"
                >
                  {t('Dashboard')}
                </Link>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="hidden md:flex btn-luxury !py-2.5 !px-4 text-[12px] uppercase tracking-wider whitespace-nowrap"
                >
                  {t('Sign In')}
                </button>
              )}
            </div>

            <button className="lg:hidden w-10 h-10 flex items-center justify-center text-primary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }} 
            className="lg:hidden fixed inset-0 z-[60] p-4 flex flex-col"
          >
            <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
              {/* Dedicated Mobile Header Bar to prevent overlap */}
              <div className="flex items-center justify-between mb-10 px-4 pt-4">
                <BrandLogo size="md" className="!h-8" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-primary hover:bg-slate-100 transition-all border border-slate-100">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-8 px-4">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button 
                    key={link.id}
                    onClick={() => link.type === 'link' ? navigate(`/${link.id}`) : scrollToSection(link.id)}
                    className="text-left py-2 font-bold text-primary text-3xl hover:text-accent transition-colors duration-500"
                  >
                    {t(link.name)}
                  </button>
                ))}
              </div>
              <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
                <div className="flex flex-col gap-8">
                   <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t('Select Language')}</p>
                     <LanguageSwitcher />
                   </div>
                   
                   {user ? (
                    <Link to="/farmer/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-luxury w-full py-5 text-center text-lg">
                      {t('Dashboard')}
                    </Link>
                  ) : (
                    <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="btn-luxury w-full py-5 text-lg">
                      {t('Sign In')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
