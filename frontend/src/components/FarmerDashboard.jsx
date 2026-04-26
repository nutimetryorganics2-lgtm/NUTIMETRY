import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  Save, 
  History, 
  User, 
  LogOut, 
  Activity,
  Truck,
  Search,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
  CloudOff
} from 'lucide-react';
import localforage from 'localforage';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useStore';
import { orderService, userService } from '../services/api';

const FarmerDashboard = () => {
  const { t } = useTranslation();
  const { logout, user, role } = useAuthStore();
  const [activeView, setActiveView] = useState('orders'); // calc, track, history, profile, orders
  const [flockData, setFlockData] = useState({
    birdCount: 1000,
    stage: 'Starter',
    mortality: 0,
    feedConsumption: 0,
    date: new Date().toISOString().split('T')[0]
  });
  const [history, setHistory] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Tracking State
  const [trackingId, setTrackingId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  
  // Orders State
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // Address Management State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    name: '', phone: '', village: '', district: '', state: '', address: '', pincode: '', is_default: false
  });

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    localforage.getItem('flock_history').then(val => { if (val) setHistory(val); });
    
    if (activeView === 'orders') {
       fetchMyOrders();
    }
    if (activeView === 'profile') {
       fetchAddresses();
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [activeView]);

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await orderService.getMyOrders();
      setMyOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setMyOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await userService.getAddresses();
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch addresses", err);
      setAddresses([]);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressFormData);
        toast.success(t('Address updated'));
      } else {
        await userService.addAddress(addressFormData);
        toast.success(t('Address added'));
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (err) {
      toast.error(t('Failed to save address'));
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm(t('Are you sure you want to delete this address?'))) return;
    try {
      await userService.deleteAddress(id);
      toast.success(t('Address deleted'));
      fetchAddresses();
    } catch (err) {
      toast.error(t('Failed to delete address'));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await userService.setDefaultAddress(id);
      toast.success(t('Default address updated'));
      fetchAddresses();
    } catch (err) {
      toast.error(t('Failed to update default address'));
    }
  };

  const calculateDosage = () => {
    const intakeMap = { Starter: 0.05, Grower: 0.1, Finisher: 0.15 };
    const inclusionMap = { Starter: 0.5, Grower: 0.75, Finisher: 1.0 };
    const feedPerDay = flockData.birdCount * intakeMap[flockData.stage];
    return (feedPerDay * inclusionMap[flockData.stage] / 100).toFixed(2);
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    const newEntry = { ...flockData, dosage: calculateDosage(), id: Date.now() };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    await localforage.setItem('flock_history', newHistory);
    toast.success(isOffline ? t("Saved locally") : t("Entry logged"));
  };

  const handleTrackOrder = async (e, directId = null) => {
    if (e) e.preventDefault();
    const idToTrack = directId || trackingId;
    if (!idToTrack) return;
    
    setTrackingLoading(true);
    try {
      const response = await orderService.trackOrder(idToTrack, user?.phone || '0000000000');
      setTrackingData(response.data);
      if (!response.data) toast.error(t("No order found with this ID"));
    } catch (err) {
      console.error("TRACK_ORDER_ERROR:", err);
      setTrackingData(null);
      toast.error(t("Tracking failed. Check ID and try again."));
    } finally {
      setTrackingLoading(false);
    }
  };

  const [isReordering, setIsReordering] = useState(false);
  const handleReorder = async (orderId) => {
    setIsReordering(orderId);
    try {
      await orderService.reorder(orderId);
      toast.success(t('Reorder placed successfully!'));
      await fetchMyOrders();
      setActiveView('orders');
    } catch (err) {
      console.error("REORDER_ERROR:", err);
      toast.error(t("Failed to place reorder. Please try again."));
    } finally {
      setIsReordering(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <Clock className="text-amber-500" size={24} />;
      case 'Processing': return <Activity className="text-blue-500" size={24} />;
      case 'Dispatched': return <Truck className="text-indigo-500" size={24} />;
      case 'Delivered': return <CheckCircle2 className="text-emerald-500" size={24} />;
      default: return <Package className="text-slate-400" size={24} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] glass-panel border-b border-white/20 px-6 py-5 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
           <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white font-black shadow-2xl shadow-primary/20 animate-float italic">N</div>
           <h1 className="text-xl font-serif font-black text-primary tracking-tight">Farmer Portal</h1>
        </div>
        <div className="flex items-center gap-4">
           {isOffline && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
           <Link to="/" className="text-[10px] font-black text-primary hover:text-accent uppercase tracking-widest transition-all mr-2 hover:-translate-x-1 inline-block">← {t('Back to Home')}</Link>
           <button onClick={logout} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-inner"><LogOut size={20} /></button>
        </div>
      </header>
      <div className="container mx-auto px-4 pt-28 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 px-2 flex justify-between items-end"
        >
           <div>
             <h2 className="text-3xl font-serif font-bold text-slate-900">{t('Namaskaram,')} {user?.name?.split(' ')[0] || 'Farmer'}</h2>
             <p className="text-slate-400 font-medium text-sm mt-1">{t('Manage your farm intelligence and orders.')}</p>
           </div>
           <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Profile</span>
              <div className="text-xs font-black text-primary uppercase">{role === 'farmer' ? 'Verified Farmer' : role}</div>
           </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeView === 'calc' && (
            <motion.div 
              key="calc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                   <Calculator size={140} />
                </div>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><Calculator size={28} /></div>
                  <h2 className="text-3xl font-serif font-black text-slate-900">{t('Dosage Calculator')}</h2>
                </div>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t('Birds')}</label>
                        <input type="number" value={flockData.birdCount} onChange={e => setFlockData({...flockData, birdCount: Math.max(0, parseInt(e.target.value) || 0)})} className="premium-input text-2xl py-6" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t('Stage')}</label>
                        <div className="relative">
                          <select value={flockData.stage} onChange={e => setFlockData({...flockData, stage: e.target.value})} className="premium-input text-lg py-6 appearance-none cursor-pointer">
                             <option value="Starter">Starter</option>
                             <option value="Grower">Grower</option>
                             <option value="Finisher">Finisher</option>
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={20} />
                        </div>
                     </div>
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-primary p-12 rounded-[3.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group"
                  >
                     <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl transition-transform group-hover:scale-125 duration-700" />
                     <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">{t('Recommended Spirulina')}</span>
                     <div className="flex items-baseline gap-4 mt-6">
                        <span className="text-8xl font-black tracking-tighter drop-shadow-2xl">{calculateDosage()}</span>
                        <span className="text-2xl opacity-60 font-black uppercase tracking-widest text-accent">{t('kg / day')}</span>
                     </div>
                  </motion.div>

                  <button onClick={handleSaveLog} className="btn-secondary w-full py-6 text-sm font-black uppercase tracking-widest">
                    <Save size={20} /> {t('Save to Activity History')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent"><Truck size={24} /></div>
                  <h2 className="text-2xl font-bold">{t('Track Shipment')}</h2>
                </div>
                
                <form onSubmit={handleTrackOrder} className="relative mb-8">
                   <input 
                     type="text" 
                     placeholder="NMO-XXXXXX"
                     value={trackingId}
                     onChange={e => setTrackingId(e.target.value.toUpperCase())}
                     className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-[1.5rem] font-bold text-xl focus:border-accent outline-none transition-all"
                   />
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                   <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                      {trackingLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={24} />}
                   </button>
                </form>

                {trackingData ? (
                  <div className="space-y-8 mt-10">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          {getStatusIcon(trackingData.status)}
                          <div>
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Current Status')}</div>
                             <div className="text-xl font-bold text-primary">{t(trackingData.status)}</div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6 px-4">
                       <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t('Timeline')}</h3>
                       <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                          {trackingData.status_history?.map((step, idx) => (
                            <div key={idx} className="relative pl-10">
                               <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-primary' : 'bg-slate-200'}`}>
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                               </div>
                               <div className="flex justify-between items-start">
                                  <div>
                                     <div className={`font-bold text-sm ${idx === 0 ? 'text-primary' : 'text-slate-400'}`}>{t(step.status)}</div>
                                     <div className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(step.timestamp).toLocaleString()}</div>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <Package size={40} />
                     </div>
                     <p className="text-slate-400 text-sm font-medium">{t('Enter your Order ID to see real-time updates.')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-2 px-2">
                 <h2 className="text-2xl font-bold">{t('Activity History')}</h2>
                 <button onClick={() => { setHistory([]); localforage.removeItem('flock_history'); }} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">{t('Clear Logs')}</button>
              </div>
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-primary transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-primary">{item.date}</div>
                        <div className="text-xs text-gray-400 font-medium">{item.birdCount} {t('birds')} · {item.stage}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="font-bold text-accent text-lg">{item.dosage} kg</div>
                      <div className="text-[10px] uppercase font-black text-slate-300 tracking-tighter">Spirulina</div>
                   </div>
                </div>
              )) : (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">{t('No activity logged yet.')}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-2 px-2">
                 <h2 className="text-2xl font-bold font-serif">{t('My Orders')}</h2>
                 <button onClick={fetchMyOrders} className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('Refresh')}</button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('Total Orders')}</div>
                    <div className="text-3xl font-bold text-primary">{Array.isArray(myOrders) ? myOrders.length : 0}</div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('Active Orders')}</div>
                    <div className="text-3xl font-bold text-accent">{Array.isArray(myOrders) ? myOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length : 0}</div>
                 </div>
              </div>
              {ordersLoading ? (
                 <div className="flex flex-col gap-6">
                    {[1,2].map(i => <div key={i} className="h-48 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />)}
                 </div>
              ) : (Array.isArray(myOrders) && myOrders.length > 0) ? myOrders.map(order => (
                <div key={order._id} className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm space-y-8 group hover:shadow-premium transition-all duration-700">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.order_id}</div>
                        <div className="text-xl font-black text-primary font-serif">{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                         order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 
                         order.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                         {t(order.status)}
                      </div>
                   </div>
 
                   <div className="space-y-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">{item.quantity}x</div>
                              <span className="text-slate-700 font-bold text-lg">{item.name}</span>
                           </div>
                           <span className="font-black text-primary">₹{ (item.price_at_purchase * item.quantity).toLocaleString() }</span>
                        </div>
                      ))}
                   </div>
 
                   <div className="pt-6 flex justify-between items-center border-t border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Total Amount')}</div>
                      <div className="text-3xl font-black text-primary tracking-tighter">₹{order.total_amount?.toLocaleString()}</div>
                   </div>
 
                    <div className="flex gap-4 pt-4">
                       <button 
                         onClick={() => { setTrackingId(order.order_id); setActiveView('track'); handleTrackOrder(null, order.order_id); }}
                         className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                       >
                         <Truck size={20} /> {t('Track Movement')}
                       </button>
                       <button 
                         onClick={() => handleReorder(order.order_id)}
                         disabled={isReordering === order.order_id}
                         className="flex-1 py-6 bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:bg-slate-200"
                       >
                         {isReordering === order.order_id ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />} 
                         {t('Reorder')}
                       </button>
                    </div>
                </div>
              )) : (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                   <Package className="mx-auto text-slate-200 mb-4" size={48} />
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('No orders found.')}</p>
                   <Link to="/" className="text-primary font-bold text-sm mt-4 inline-block hover:underline">{t('Browse Products')}</Link>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="text-center py-20 overflow-y-auto max-h-[80vh] no-scrollbar"
            >
              <div className="relative inline-block mb-8">
                 <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-2xl">
                    <User size={56} />
                 </div>
                 <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full" />
              </div>
              <h2 className="text-3xl font-bold mb-2 font-serif">{user?.name}</h2>
              <p className="text-slate-400 mb-10 font-bold text-sm tracking-wide">{user?.phone || user?.email}</p>
              
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12">
                 <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={24} />
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Verified')}</div>
                 </div>
                 <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-2">
                    <MapPin className="text-primary" size={24} />
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Andhra')}</div>
                 </div>
              </div>

              <button onClick={logout} className="px-10 py-4 bg-rose-50 text-rose-500 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 mx-auto mb-16">
                 <LogOut size={16} /> {t('Sign Out of Portal')}
              </button>

              {/* Saved Addresses Section */}
              <div className="text-left mt-16 border-t border-slate-100 pt-16 pb-12 px-2">
                  <div className="flex justify-between items-center mb-8 px-2">
                    <h3 className="text-2xl font-serif font-bold text-slate-900">{t('Saved Addresses')}</h3>
                    <button 
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressFormData({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          village: user?.village || '',
                          district: user?.district || '',
                          state: user?.state || '',
                          address: user?.address || '',
                          pincode: user?.pincode || '',
                          is_default: false
                        });
                        setShowAddressForm(true);
                      }}
                      className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                      {t('+ Add New')}
                    </button>
                  </div>

                  {showAddressForm && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-8 rounded-[2rem] border-2 border-primary/10 mb-12 shadow-xl"
                    >
                      <h4 className="font-bold text-primary mb-6">{editingAddress ? t('Edit Address') : t('Add New Address')}</h4>
                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        <input type="text" placeholder={t('Full Name')} value={addressFormData.name} onChange={e => setAddressFormData({...addressFormData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary/20" required />
                        <input type="text" placeholder={t('Phone')} value={addressFormData.phone} onChange={e => setAddressFormData({...addressFormData, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary/20" required />
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder={t('Village')} value={addressFormData.village} onChange={e => setAddressFormData({...addressFormData, village: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none" required />
                          <input type="text" placeholder={t('District')} value={addressFormData.district} onChange={e => setAddressFormData({...addressFormData, district: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder={t('State')} value={addressFormData.state} onChange={e => setAddressFormData({...addressFormData, state: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none" required />
                          <input type="text" placeholder={t('Pincode')} value={addressFormData.pincode} onChange={e => setAddressFormData({...addressFormData, pincode: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none" required />
                        </div>
                        <textarea placeholder={t('Street Address')} value={addressFormData.address} onChange={e => setAddressFormData({...addressFormData, address: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none min-h-[100px]" required />
                        
                        <div className="flex items-center gap-3 px-1">
                          <input type="checkbox" id="default_addr" checked={addressFormData.is_default} onChange={e => setAddressFormData({...addressFormData, is_default: e.target.checked})} className="w-4 h-4 accent-primary" />
                          <label htmlFor="default_addr" className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Set as Default')}</label>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-xl font-bold">{t('Save Address')}</button>
                          <button type="button" onClick={() => setShowAddressForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold">{t('Cancel')}</button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {addresses.length > 0 ? addresses.map(addr => (
                      <div key={addr.id} className={`p-6 rounded-[2rem] border-2 transition-all ${addr.is_default ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-50 bg-white'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-bold text-slate-900">{addr.name}</div>
                            <div className="text-xs font-medium text-slate-400 mt-1">{addr.phone}</div>
                          </div>
                          {addr.is_default && <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-full">{t('Default')}</span>}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                          {addr.address}, {addr.village},<br />
                          {addr.district}, {addr.state} - {addr.pincode}
                        </p>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddressFormData(addr);
                              setShowAddressForm(true);
                              // Scroll to the top of the form
                              const formElement = document.querySelector('.profile-container');
                              if (formElement) formElement.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="text-[10px] font-black text-primary uppercase tracking-widest"
                          >
                            {t('Edit')}
                          </button>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary">
                              {t('Set as Default')}
                            </button>
                          )}
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600">
                            {t('Delete')}
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <MapPin className="mx-auto text-slate-200 mb-4" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('No saved addresses yet.')}</p>
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm glass-pill p-2 z-50 flex justify-between items-center border border-white/20">
        <button 
          onClick={() => setActiveView('calc')}
          className={`flex-1 flex flex-col items-center py-4 rounded-full transition-all ${activeView === 'calc' ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Calculator size={22} className={activeView === 'calc' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Dosage</span>
        </button>
        <button 
          onClick={() => setActiveView('orders')}
          className={`flex-1 flex flex-col items-center py-4 rounded-full transition-all ${activeView === 'orders' ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Package size={22} className={activeView === 'orders' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Orders</span>
        </button>
        <button 
          onClick={() => setActiveView('track')}
          className={`flex-1 flex flex-col items-center py-4 rounded-full transition-all ${activeView === 'track' ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <Truck size={22} className={activeView === 'track' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Track</span>
        </button>
        <button 
          onClick={() => setActiveView('profile')}
          className={`flex-1 flex flex-col items-center py-4 rounded-full transition-all ${activeView === 'profile' ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-primary'}`}
        >
          <User size={22} className={activeView === 'profile' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Profile</span>
        </button>
      </nav>

      {isOffline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-30 flex items-center gap-2">
          <CloudOff size={14} /> Offline Mode Active
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
