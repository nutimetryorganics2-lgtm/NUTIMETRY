import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, CheckCircle, ArrowRight, Phone, MessageCircle, MapPin, User, FileText, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { userService, orderService } from '../services/api';
import { useAuthStore, useCartStore } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const OrderModal = () => {
  const { isCartOpen: isOpen, closeCart: onClose, cart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState('cart'); // 'cart', 'summary', 'success'
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep('cart');
      setErrorState(false);
      setIdempotencyKey(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
      if (isAuthenticated) fetchAddresses();
    }
    
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => document.body.style.overflow = 'auto';
  }, [isOpen, isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await userService.getAddresses();
      const addrs = response.data || [];
      setAddresses(addrs);
      const def = addrs.find(a => a.is_default) || addrs[0];
      if (def) setSelectedAddressId(def.id);
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const displayAddress = selectedAddress 
    ? `${selectedAddress.address}, ${selectedAddress.village}, ${selectedAddress.district}, ${selectedAddress.state} - ${selectedAddress.pincode}`
    : (user?.address ? `${user.address}, ${user.village || ''}, ${user.district || ''}, ${user.state || ''} - ${user.pincode || ''}` : 'Set in profile');

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      onClose();
      // Small timeout to allow modal animation/state to clear before navigation
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            from: location.pathname,
            openCart: true 
          } 
        });
      }, 100);
      return;
    }
    setStep('summary');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      const orderData = {
        items: cart.filter(item => (item.id || item._id)).map(item => ({ 
          product_id: item.id || item._id, 
          quantity: item.quantity 
        })),
        idempotency_key: idempotencyKey,
        selected_address_id: selectedAddressId
      };

      const response = await orderService.createOrder(orderData);
      setLastOrder(response.data.data || response.data);
      setStep('success');
      clearCart();
      toast.success(t('Order Placed Successfully'));
    } catch (error) {
      setErrorState(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full max-w-[400px] bg-white shadow-2xl z-[100] flex flex-col cart-container"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="cart-header shrink-0 p-8 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-2xl font-serif font-bold text-primary">
            {step === 'success' ? t('Order Confirmed') : t('My Farm Bundle')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* SCROLLABLE ITEMS Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 scroll-smooth custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'cart' && (
              <motion.div key="cart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <ShoppingBag size={48} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-400 font-bold text-lg">{t('Bundle is empty')}</p>
                      <button onClick={onClose} className="text-primary font-black hover:underline underline-offset-8 transition-all">{t('Start Shopping')}</button>
                    </div>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={item.id || item._id} 
                      className="flex gap-5 p-5 bg-white rounded-[2.5rem] group border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-500"
                    >
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-50 shrink-0 shadow-inner">
                        <img 
                          src={item.image_url || '/spirulina_macro.png'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          onError={(e) => { e.target.src = '/spirulina_macro.png'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-black text-slate-900 truncate text-lg tracking-tight">{item.name}</h4>
                          <p className="text-accent font-black text-sm">₹{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
                            <button onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)} className="text-slate-400 hover:text-primary transition-colors"><Minus size={16}/></button>
                            <span className="font-black text-sm w-6 text-center text-primary">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)} className="text-slate-400 hover:text-primary transition-colors"><Plus size={16}/></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id || item._id)} className="text-slate-300 hover:text-rose-500 transition-all p-2 hover:bg-rose-50 rounded-full"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {step === 'summary' && (
              <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                   <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                       <FileText size={20} />
                     </div>
                     {t('Confirmation')}
                   </h3>
                   <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('Farmer Name')}</span>
                        <span className="font-black text-primary">{user?.name}</span>
                      </div>
                      <div className="flex justify-between items-start text-sm pt-4 border-t border-primary/5">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{t('Delivery To')}</span>
                        <span className="font-black text-primary text-right max-w-[180px] leading-relaxed">{displayAddress}</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{t('Order Details')}</p>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id || item._id} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden">
                              <img src={item.image_url || '/spirulina_macro.png'} className="w-full h-full object-cover" />
                           </div>
                           <span className="text-sm font-black text-slate-700">{item.name} <span className="text-slate-300 ml-1">x{item.quantity}</span></span>
                        </div>
                        <span className="font-black text-primary">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success" 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="py-6 text-center space-y-10"
              >
                <div className="relative mx-auto w-40 h-40">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                    className="w-full h-full bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10"
                  >
                    <CheckCircle size={80} />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-emerald-500 rounded-full"
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-serif font-black text-primary leading-tight">{t('Order Placed Successfully')}</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                       <Lock size={12} /> {t('Confirmed & Secure')}
                    </div>
                  </div>
                  
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Reference ID')}</p>
                    <p className="text-3xl font-black text-primary tracking-tighter group-hover:text-accent transition-colors duration-500">{lastOrder?.order_id || 'NMO-XXXXXX'}</p>
                  </div>

                  <p className="text-xl text-slate-500 font-bold px-6 leading-relaxed">
                    {t('Our logistics team will contact you shortly to coordinate the farm-gate delivery.')}
                  </p>
                </div>

                <div className="pt-4 space-y-4 px-2">
                  <a 
                    href="https://wa.me/919121337792" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 hover:bg-emerald-100 transition-all group"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-md group-hover:scale-110 transition-transform">
                      <MessageCircle size={32} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">{t('WhatsApp Support')}</p>
                      <p className="text-xl font-black text-emerald-900">+91 9121337792</p>
                    </div>
                  </a>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="btn-luxury-outline w-full !py-4"
                    >
                      {t('Print Receipt')}
                    </button>
                    <button 
                      onClick={() => { navigate('/'); onClose(); }} 
                      className="btn-luxury w-full !py-4"
                    >
                      {t('Finish')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FIXED CHECKOUT Area (Sticky Footer) */}
        {step !== 'success' && cart.length > 0 && (
          <div className="shrink-0 p-10 border-t border-slate-100 bg-white/80 backdrop-blur-xl sticky bottom-0 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-8 px-2">
              <div className="flex flex-col">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">
                  {step === 'cart' ? t('Estimated Total') : t('Total Payable')}
                </span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Tax & Logistics Incl.</span>
                </div>
              </div>
              <span className="text-4xl font-serif font-black text-primary tracking-tighter">₹{total.toLocaleString()}</span>
            </div>
            
            {step === 'cart' ? (
            <div className="space-y-4">
              <button 
                onClick={handleCheckoutClick}
                className="btn-luxury w-full !py-5 text-lg"
              >
                {isAuthenticated ? t('Checkout Now') : t('Login to Checkout')} <ArrowRight size={20} />
              </button>
              <button onClick={() => { navigate('/'); onClose(); }} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all text-center">{t('← Continue Shopping')}</button>
            </div>
            ) : (
              <div className="space-y-6">
                {errorState && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-xs font-bold mb-6 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      <Lock size={16} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="mb-1">{t('Network Latency Detected')}</p>
                      <p className="opacity-60 text-[10px]">{t('Please retry the secure order lock.')}</p>
                    </div>
                  </motion.div>
                )}
                <button 
                  disabled={loading}
                  onClick={handlePlaceOrder}
                  className={`btn-luxury w-full !py-5 text-lg ${errorState ? 'from-rose-600 to-rose-500' : ''}`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{errorState ? t('Retry Secure Order') : t('Confirm Secure Order')} <Lock size={20} className="ml-2 opacity-50" /></>
                  )}
                </button>
                <button onClick={() => setStep('cart')} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all text-center">{t('Edit Farm Bundle')}</button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default OrderModal;
