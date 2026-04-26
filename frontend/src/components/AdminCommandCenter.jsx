import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  flexRender 
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Users, 
  Activity, 
  Settings, 
  Plus, 
  X,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Lock,
  ArrowLeft,
  LogOut,
  Search,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useDashboardStore } from '../store/useStore';
import { orderService, productService, authService } from '../services/api';
import { toast } from 'react-hot-toast';

const AdminCommandCenter = () => {
  const { activeTab, setActiveTab } = useDashboardStore();
  const { logout } = useAuthStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    orders_today: 0,
    total_pending: 0,
    weekly_trend: '0%',
    low_stock_alerts: []
  });

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered').length;
  }, [orders]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    image: null,
    manual_image_url: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30s for Live Updates
    const interval = setInterval(fetchData, 30000);
    
    if (isDrawerOpen) document.body.classList.add('overlay-active');
    else document.body.classList.remove('overlay-active');
    
    return () => {
      document.body.classList.remove('overlay-active');
      clearInterval(interval);
    };
  }, [isDrawerOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, mRes] = await Promise.all([
        productService.getProducts(),
        orderService.getOrders(),
        orderService.getMetrics()
      ]);
      
      // Prevent Duplicate Key Issues & UI Doubling
      const rawProducts = Array.isArray(pRes.data) ? pRes.data : [];
      const uniqueProducts = [];
      const seenIds = new Set();
      for (const p of rawProducts) {
        const id = p._id || p.id;
        if (id && !seenIds.has(id)) {
          uniqueProducts.push(p);
          seenIds.add(id);
        }
      }
      
      setProducts(uniqueProducts);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      setMetrics(mRes.data || { orders_today: 0, total_pending: 0, weekly_trend: '0%', low_stock_alerts: [] });
    } catch (err) {
      console.error("FETCH_DATA_ERROR:", err);
      toast.error("Data synchronization failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Order ${status}`);
      fetchData();
    } catch (err) {
      console.error("STATUS_UPDATE_ERROR:", err);
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.image && !newProduct.manual_image_url) {
      toast.error("Product image is required (Upload or URL)");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', parseFloat(newProduct.price) || 0);
    formData.append('stock', parseInt(newProduct.stock) || 0);
    formData.append('description', newProduct.description);
    
    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }
    if (newProduct.manual_image_url) {
      formData.append('manual_image_url', newProduct.manual_image_url);
    }

    try {
      await productService.createProduct(formData);
      toast.success("Product Master Created");
      setIsDrawerOpen(false);
      setNewProduct({ 
        name: '', 
        price: '', 
        stock: '', 
        description: '', 
        image: null, 
        manual_image_url: '' 
      });
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error("CREATE_PRODUCT_ERROR:", err);
      const detail = err.response?.data?.detail;
      const errorMessage = Array.isArray(detail) 
        ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') 
        : (detail || "Failed to create product. Check server logs.");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProduct({ ...newProduct, image: file, manual_image_url: '' });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const columns = useMemo(() => [
    { accessorKey: 'order_id', header: 'ID' },
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'phone', header: 'Contact' },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row, getValue }) => {
        const val = getValue();
        const colors = {
          'Pending': 'bg-amber-100 text-amber-700',
          'Processing': 'bg-blue-100 text-blue-700',
          'Dispatched': 'bg-indigo-100 text-indigo-700',
          'Delivered': 'bg-emerald-100 text-emerald-700',
          'Cancelled': 'bg-rose-100 text-rose-700'
        };
        const statusValue = getValue() || 'Pending';
        return (
          <select 
            value={statusValue}
            onChange={(e) => handleStatusUpdate(row.original._id, e.target.value)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none outline-none cursor-pointer ${colors[statusValue] || 'bg-slate-100 text-slate-600'}`}
          >
            {['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'].map(s => (
              <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
            ))}
          </select>
        );
      }
    },
    { 
      accessorKey: 'email_status', 
      header: 'Email',
      cell: ({ getValue }) => {
        const val = getValue();
        const colors = {
          'sent': 'bg-emerald-100 text-emerald-700',
          'pending': 'bg-amber-100 text-amber-700',
          'failed': 'bg-rose-100 text-rose-700'
        };
        return (
          <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter inline-flex items-center gap-1 ${colors[val] || 'bg-slate-100 text-slate-600'}`}>
            {val === 'failed' && <AlertTriangle size={10} />}
            {val}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button 
          onClick={() => setSelectedOrder(row.original)}
          className="px-4 py-2 bg-slate-50 text-primary font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all"
        >
          Details
        </button>
      )
    }
  ], []);

  const table = useReactTable({
    data: orders,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const variants = {
    initial: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  const [[page, direction], setPage] = useState([0, 0]);
  const handleTabChange = (tab, newDir) => {
    setActiveTab(tab);
    setPage([page + 1, newDir]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-[90] border-b border-slate-100 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-emerald-50">
            <img src="/assets/logo_dashboard.jpg" alt="Nutimetry" className="w-full h-full object-cover scale-110" />
          </div>
          <span className="font-serif font-black text-lg text-primary tracking-tight">Command Center</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-12 h-12 bg-slate-50 text-primary rounded-full flex items-center justify-center border border-slate-100 active:scale-95 transition-all shadow-sm"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[105] 
        w-72 bg-primary text-white flex flex-col p-8 
        transition-all duration-500 glass-dark border-r border-white/5
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-5 mb-16 px-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border border-emerald-500/10 animate-float">
            <img src="/assets/logo_dashboard.jpg" alt="Nutimetry" className="w-full h-full object-cover scale-125" />
          </div>
          <div>
            <span className="block font-serif font-black text-xl tracking-tight leading-none">Nutimetry</span>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Command Center</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          <button onClick={() => { handleTabChange('overview', -1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all group ${activeTab === 'overview' ? 'bg-white text-primary font-black shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
             <Activity size={22} className={activeTab === 'overview' ? 'text-accent' : 'group-hover:scale-110 transition-transform'} /> <span>Overview</span>
          </button>
          <button onClick={() => { handleTabChange('inventory', activeTab === 'overview' ? 1 : -1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all group ${activeTab === 'inventory' ? 'bg-white text-primary font-black shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
             <Package size={22} className={activeTab === 'inventory' ? 'text-accent' : 'group-hover:scale-110 transition-transform'} /> <span>Inventory</span>
          </button>
          <button onClick={() => { handleTabChange('network', 1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all group ${activeTab === 'network' ? 'bg-white text-primary font-black shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
             <Users size={22} className={activeTab === 'network' ? 'text-accent' : 'group-hover:scale-110 transition-transform'} /> <span>Broiler Network</span>
          </button>
          <button onClick={() => { handleTabChange('settings', 1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all group ${activeTab === 'settings' ? 'bg-white text-primary font-black shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
             <Settings size={22} className={activeTab === 'settings' ? 'text-accent' : 'group-hover:scale-110 transition-transform'} /> <span>System Config</span>
          </button>
        </nav>

        <Link to="/" className="flex items-center gap-4 p-4 text-white/40 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={20} /> <span>Back to Portal</span>
        </Link>
        <button onClick={logout} className="flex items-center gap-4 p-4 text-white/40 hover:text-red-400 transition-colors font-bold text-xs uppercase tracking-widest">
          <LogOut size={20} /> <span>Logout Session</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar bg-[#F8FAFC] pt-20 lg:pt-0">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-12 box-border min-h-full">
          <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {activeTab === 'overview' && (
              <div className="space-y-8 sm:space-y-10">
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 pb-10 border-b border-slate-100">
                   <div className="space-y-2 text-left w-full max-w-xl">
                      <h1 className="text-2xl md:text-[1.75rem] font-serif font-black text-slate-900 tracking-tight leading-tight">System Overview</h1>
                      <p className="text-xs md:text-base text-[#1B4332] font-medium opacity-60">
                         స్పిరులినా తో కోళ్ల ఆరోగ్యం మేరుగ్గా.. లాభం మరింతగా!
                      </p>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/50 shadow-sm w-full xl:w-auto">
                      <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                      </div>
                      <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none self-center">Sync: {new Date().toLocaleTimeString()}</p>
                      <button 
                        onClick={fetchData}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-md active:scale-95"
                      >
                        <Activity size={14} className={loading ? "animate-spin" : ""} />
                        <span className="whitespace-nowrap">Sync Dashboard</span>
                      </button>
                   </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                   <motion.div whileHover={{ y: -5 }} className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 lg:p-8 text-primary opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                        <Clock size={64} className="lg:w-20 lg:h-20" />
                      </div>
                      <div className="relative z-10">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 block">Orders Today</span>
                        <div className="flex items-baseline gap-4">
                          <div className="text-4xl lg:text-5xl xl:text-6xl font-black text-primary tracking-tight">
                            {metrics?.orders_today || 0}
                          </div>
                          {(metrics?.orders_today > 0) && (
                            <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                               <ChevronRight className="-rotate-90" size={14} />
                               {metrics?.weekly_trend || '0%'}
                            </div>
                          )}
                        </div>
                      </div>
                   </motion.div>

                   <motion.div whileHover={{ y: -5 }} className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 lg:p-8 text-amber-500 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                        <AlertTriangle size={64} className="lg:w-20 lg:h-20" />
                      </div>
                      <div className="relative z-10">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 block">Pending Fulfillment</span>
                        <div className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{metrics?.total_pending || 0}</div>
                      </div>
                   </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 lg:p-8 text-accent opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                        <Package size={64} className="lg:w-20 lg:h-20" />
                      </div>
                      <div className="relative z-10 pr-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 block">Gross Revenue</span>
                        <div className={`font-black text-accent tracking-tighter whitespace-nowrap transition-all duration-500 ${
                          (metrics?.total_revenue || 0).toLocaleString().length > 12 ? 'text-lg sm:text-xl' :
                          (metrics?.total_revenue || 0).toLocaleString().length > 10 ? 'text-xl sm:text-2xl' : 
                          (metrics?.total_revenue || 0).toLocaleString().length > 8 ? 'text-2xl sm:text-3xl' : 
                          'text-3xl sm:text-4xl lg:text-5xl'
                        }`}>
                          ₹{(metrics?.total_revenue || 0).toLocaleString()}
                        </div>
                      </div>
                   </motion.div>
                </div>

                {(metrics?.low_stock_alerts || []).length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-rose-50 border border-rose-100 p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-10 text-rose-200 opacity-20"><AlertTriangle size={120} /></div>
                      <h3 className="text-rose-900 text-lg lg:text-xl font-black flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                           <AlertTriangle size={20} className="text-rose-500" />
                        </div>
                        Critical Inventory Alerts
                      </h3>
                      <div className="flex flex-wrap gap-4 relative z-10">
                        {(metrics?.low_stock_alerts || []).map(item => (
                          <div key={item.id} className="bg-white px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-xs lg:text-sm font-black text-rose-600 border border-rose-100 shadow-sm flex items-center gap-3">
                             <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                             {item.name}: <span className="text-rose-400 font-bold ml-1">{item.stock} Units Remaining</span>
                          </div>
                        ))}
                      </div>
                   </motion.div>
                )}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-8 sm:space-y-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                   <div className="w-full sm:w-auto">
                      <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">Product Master</h1>
                      <p className="text-xs md:text-base text-slate-500 mt-1">Manage spirulina catalog and price tiers.</p>
                   </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                     <button 
                       onClick={async () => {
                        try {
                          toast.loading("Preparing Order Export...", { id: 'export-toast' });
                          const response = await orderService.exportOrders();
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `nutimetryorganics_orders_${new Date().toISOString().split('T')[0]}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          link.parentNode.removeChild(link);
                          toast.success("Export Successful", { id: 'export-toast' });
                        } catch (err) {
                          toast.error("Export failed. Please try again.", { id: 'export-toast' });
                        }
                       }} 
                       className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                     >
                        <Package size={16} /> <span className="whitespace-nowrap">Export CSV</span>
                     </button>
                     <button onClick={() => setIsDrawerOpen(true)} className="flex-1 sm:flex-none bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <Plus size={16} /> <span className="whitespace-nowrap">New Product</span>
                     </button>
                   </div>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                   {Array.isArray(products) && products.length > 0 ? products.map(p => (
                     <motion.div 
                       key={p._id || p.id} 
                       whileHover={{ y: -5 }}
                       className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-premium transition-all duration-500 relative"
                     >
                        <div className="w-full aspect-square bg-slate-50 rounded-[2rem] mb-6 flex items-center justify-center text-slate-300 overflow-hidden relative shadow-inner">
                           {p.image_url ? (
                             <img 
                               src={p.image_url} 
                               alt={p.name} 
                               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                               onError={(e) => { e.target.src = '/spirulina_macro.png'; }}
                             />
                           ) : (
                             <ImageIcon size={48} />
                           )}
                           <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary shadow-xl border border-white/20">
                             {p.stock} {p.stock === 1 ? 'Unit' : 'Units'}
                           </div>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors duration-500 tracking-tight leading-tight mb-2">{p.name}</h3>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed line-clamp-2 mb-8">{p.description}</p>
                        <div className="flex justify-between items-end min-h-[80px]">
                           <span className="font-serif font-black text-2xl lg:text-3xl text-primary tracking-tighter">₹{p.price.toLocaleString()}</span>
                            <div className="flex flex-col items-end gap-2">
                              {deletingId === (p._id || p.id) ? (
                                <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2">
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const productId = p._id || p.id;
                                      const originalProducts = [...products];
                                      setProducts(products.filter(item => (item._id || item.id) !== productId));
                                      try {
                                        await productService.deleteProduct(productId);
                                        toast.success("Product removed permanently");
                                        setDeletingId(null);
                                        fetchData();
                                      } catch (err) {
                                        setProducts(originalProducts);
                                        setDeletingId(null);
                                        toast.error("Failed to remove product");
                                      }
                                    }}
                                    className="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(null);
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors pr-2"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingId(p._id || p.id);
                                  }} 
                                  className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white rounded-full transition-all duration-300 active:scale-90"
                                >
                                  <X size={20} />
                                </button>
                              )}
                            </div>
                        </div>
                      </motion.div>
                   )) : (
                      <div className="col-span-full py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] border-2 border-dashed border-slate-100 rounded-[4rem] bg-white">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Package size={32} />
                        </div>
                        {loading ? 'Synchronizing Catalog...' : 'Catalog Empty'}
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="space-y-8">
                <header>
                   <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900">Broiler Network</h1>
                   <p className="text-xs md:text-base text-slate-500 mt-1">Real-time performance monitoring of {orders.length} orders.</p>
                </header>
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
                       <div className="relative w-full md:w-80">
                          <input 
                            type="text" 
                            placeholder="Search network..." 
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                          className="premium-input-luxury pl-12 pr-6 py-4 text-sm w-full"
                          />
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       </div>
                       <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-left md:text-right">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Orders</div>
                             <div className="text-lg font-black text-primary">{activeOrdersCount}</div>
                          </div>
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                             <Users size={20} />
                          </div>
                       </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                         <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                              <tr key={headerGroup.id} className="bg-slate-50/50">
                                 {headerGroup.headers.map(header => (
                                   <th key={header.id} className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                      {flexRender(header.column.columnDef.header, header.getContext())}
                                   </th>
                                 ))}
                              </tr>
                            ))}
                         </thead>
                         <tbody>
                            {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map(row => (
                              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-300 group">
                                 {row.getVisibleCells().map(cell => (
                                   <td key={cell.id} className="px-6 md:px-10 py-5 md:py-7 text-xs md:text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                   </td>
                                 ))}
                              </tr>
                            )) : (
                              <tr>
                                 <td colSpan={columns.length} className="py-20 md:py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                                    No records matching filter
                                 </td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
               <div className="space-y-8 max-w-2xl">
                 <header>
                    <h1 className="text-4xl font-serif font-bold text-slate-900">Security Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your administrative credentials and access.</p>
                 </header>

                 <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                       <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Lock size={24} /></div>
                       <div>
                          <h3 className="text-xl font-bold">Change Administrative Password</h3>
                          <p className="text-xs text-slate-400 font-medium">Ensure a strong password to protect the broiler network.</p>
                       </div>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (passwordData.new_password !== passwordData.confirm_password) {
                          toast.error("New passwords do not match");
                          return;
                        }
                        if (passwordData.new_password.length < 6) {
                          toast.error("Password must be at least 6 characters");
                          return;
                        }
                        
                        setIsChangingPassword(true);
                        try {
                          await authService.changePassword({
                            old_password: passwordData.old_password,
                            new_password: passwordData.new_password
                          });
                          toast.success("Password Updated Successfully");
                          setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                        } catch (err) {
                          // Error handled by interceptor
                        } finally {
                          setIsChangingPassword(false);
                        }
                      }}
                      className="space-y-6"
                    >
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                          <input 
                            type="password" 
                            required
                            value={passwordData.old_password}
                            onChange={e => setPasswordData({...passwordData, old_password: e.target.value})}
                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-primary transition-all outline-none" 
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
                             <input 
                               type="password" 
                               required
                               value={passwordData.new_password}
                               onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                               className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-primary transition-all outline-none" 
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                             <input 
                               type="password" 
                               required
                               value={passwordData.confirm_password}
                               onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                               className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-primary transition-all outline-none" 
                             />
                          </div>
                       </div>
                       <button 
                         type="submit" 
                         disabled={isChangingPassword}
                         className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                       >
                         {isChangingPassword ? <Activity size={24} className="animate-spin" /> : "Update Credentials"}
                       </button>
                    </form>
                 </div>
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>

      {/* Sliding Product Drawer */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[100]" />
              <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-xl bg-white z-[101] shadow-2xl p-10 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-bold font-serif">Add New Formulation</h2>
                   <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                </div>
                <form onSubmit={handleCreateProduct} className="space-y-8 flex-1 overflow-y-auto no-scrollbar pr-4">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Product Visual (Upload or URL)</label>
                     <div className="relative group">
                       <div className="w-full h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-primary group-hover:bg-primary/[0.02] shadow-inner">
                         {imagePreview || newProduct.manual_image_url ? (
                           <img 
                             src={imagePreview || newProduct.manual_image_url} 
                             alt="Preview" 
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                             onError={(e) => {
                               if (newProduct.manual_image_url) {
                                 e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                               }
                             }}
                           />
                         ) : (
                           <div className="text-center space-y-4">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                                <Plus size={32} />
                             </div>
                             <span className="text-xs text-slate-400 font-black uppercase tracking-widest block">Tap to upload asset</span>
                           </div>
                         )}
                         <input 
                           type="file" 
                           accept="image/*" 
                           onChange={handleImageChange} 
                           className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                         />
                       </div>
                       {(imagePreview || newProduct.manual_image_url) && (
                         <button 
                           type="button"
                           onClick={() => { 
                             setImagePreview(null); 
                             setNewProduct({...newProduct, image: null, manual_image_url: ''}); 
                           }}
                           className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-full shadow-2xl z-20 hover:scale-110 transition-transform"
                         >
                           <X size={16} />
                         </button>
                       )}
                     </div>
                     
                     <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">External Link Source</label>
                       <input 
                         type="text" 
                         placeholder="https://..." 
                         value={newProduct.manual_image_url || ''} 
                         onChange={e => {
                           const url = e.target.value;
                           setNewProduct({...newProduct, manual_image_url: url, image: null});
                           setImagePreview(null);
                         }}
                         className="premium-input-luxury py-4 text-xs"
                       />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Formulation Name</label>
                     <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="premium-input-luxury py-6 text-lg font-black" placeholder="e.g. Spirulina Gold" required />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Technical Description</label>
                     <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="premium-input-luxury py-6 min-h-[120px] resize-none leading-relaxed" placeholder="Enter product advantages..." required />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Price (₹)</label>
                        <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="premium-input-luxury py-6 text-xl font-serif font-black" required />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Initial Inventory</label>
                        <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="premium-input-luxury py-6 text-xl font-black" required />
                     </div>
                  </div>

                  <div className="pt-8">
                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="w-full py-8 bg-primary text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                     >
                       {isSubmitting ? (
                         <Activity size={28} className="animate-spin" />
                       ) : (
                         "Publish Formulation"
                       )}
                     </button>
                  </div>
                </form>
              </motion.aside>
            </>
          )}
          {/* Order Details Drawer */}
          <AnimatePresence>
            {selectedOrder && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[110]" />
                <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[111] shadow-2xl p-10 overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center mb-10">
                     <h2 className="text-2xl font-bold font-serif">Order Dossier</h2>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Package size={80} /></div>
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">{selectedOrder.order_id}</div>
                      <div className="text-2xl font-bold mb-1">{selectedOrder.customer_name}</div>
                      <div className="text-accent font-bold">{selectedOrder.phone}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                        <div className="font-bold text-slate-700">{selectedOrder.status}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</div>
                        <div className="font-bold text-primary">₹{selectedOrder.total_amount?.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${selectedOrder.email_status === 'failed' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Delivery</div>
                        <div className={`font-bold flex items-center gap-2 ${selectedOrder.email_status === 'failed' ? 'text-rose-600' : 'text-slate-700'}`}>
                           {selectedOrder.email_status}
                           {selectedOrder.email_status === 'failed' && <AlertTriangle size={14} />}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Retries</div>
                        <div className="font-bold text-slate-700">{selectedOrder.retry_count} / 3</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Delivery Address</h4>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">{selectedOrder.address}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <div>
                              <div className="text-sm font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] font-bold text-slate-400">Qty: {item.quantity}</div>
                            </div>
                            <div className="text-sm font-bold text-primary">₹{(item.price_at_purchase * item.quantity).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">System Audit Log</h4>
                      <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 pl-8">
                        {selectedOrder.status_history?.map((h, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-7 top-1 w-2 h-2 rounded-full bg-primary" />
                            <div className="text-xs font-bold text-slate-900">{h.status}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{new Date(h.timestamp).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-10">
                      <button 
                        onClick={() => window.print()}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl"
                      >
                        Generate Invoice PDF
                      </button>
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AdminCommandCenter;
