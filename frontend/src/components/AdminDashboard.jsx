import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Package, Users, Settings, LogOut, CheckCircle, Download, Eye, AlertTriangle } from 'lucide-react';
import './AdminDashboard.css';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) { navigate('/admin/login'); return; }
        
        // Fetch Orders
        const resOrders = await api.get('/orders/', { headers: { Authorization: `Bearer ${token}` } });
        const sortedOrders = resOrders.data.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setOrders(sortedOrders);

        // Fetch Metrics
        const resMetrics = await api.get('/orders/metrics', { headers: { Authorization: `Bearer ${token}` } });
        setMetrics(resMetrics.data);

      } catch (err) {
        if (err.response?.status === 401) {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
        }
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.patch(`/orders/${orderId}/status?status=${status}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    if (order.is_seen) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.patch(`/orders/${order._id}/seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(orders.map(o => o._id === order._id ? { ...o, is_seen: true } : o));
    } catch (err) {
      console.error("Failed to mark as seen");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/orders/export', { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Export started");
    } catch (err) {
      toast.error("Failed to export orders");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout animate-in">
      <aside className="admin-sidebar ledger-surface">
        <div className="admin-brand">Nutimetry Admin</div>
        <nav>
          <button className="active"><Package size={18} /> Orders</button>
          <button onClick={() => toast("Products Management Coming Soon")}><Users size={18} /> Products</button>
          <button onClick={() => toast("Content CMS Coming Soon")}><Settings size={18} /> Content CMS</button>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Logout</button>
        </nav>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header flex justify-between align-center" style={{marginBottom: '20px'}}>
          <h2>Business Overview</h2>
          <button className="btn btn-outline haptic-press" onClick={handleExportCSV}>
            <Download size={16} style={{marginRight: '8px'}} /> Export CSV
          </button>
        </header>

        {metrics?.low_stock_alerts?.length > 0 && (
          <div className="alert-banner" style={{background: '#ffeaa7', padding: '12px 20px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#d35400', fontWeight: '500'}}>
            <AlertTriangle size={20} />
            <span>Warning: {metrics.low_stock_alerts.length} product(s) are low on stock. Please refill inventory immediately to prevent missed sales.</span>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card ledger-surface">
            <h3>Orders Today</h3>
            <p className="stat-value">{metrics ? metrics.orders_today : '-'}</p>
          </div>
          <div className="stat-card ledger-surface">
            <h3>Pending Fulfillment</h3>
            <p className="stat-value text-warning">{metrics ? metrics.total_pending : '-'}</p>
          </div>
          <div className="stat-card ledger-surface">
            <h3>Weekly Growth</h3>
            <p className="stat-value text-success">{metrics ? metrics.weekly_trend : '-'}</p>
          </div>
        </div>

        <section className="orders-section ledger-surface mt-8">
          <h3>Recent Orders</h3>
          {loading ? <p>Loading orders...</p> : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr 
                      key={order._id} 
                      onClick={() => handleOrderClick(order)}
                      style={{ cursor: 'pointer', backgroundColor: !order.is_seen ? 'rgba(0,100,255,0.05)' : 'transparent' }}
                    >
                      <td>
                        {order.order_id} 
                        {!order.is_seen && <span style={{marginLeft: '8px', fontSize: '10px', background: 'var(--primary-color)', color: 'white', padding: '2px 6px', borderRadius: '4px'}}>NEW</span>}
                      </td>
                      <td>
                        <strong>{order.customer_name}</strong><br/>
                        <small>{order.phone}</small>
                      </td>
                      <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                          {order.status === 'Pending' && <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={() => updateStatus(order._id, 'Processing')}>Process</button>}
                          {order.status === 'Processing' && <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={() => updateStatus(order._id, 'Dispatched')}>Dispatch</button>}
                          {order.status === 'Dispatched' && <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={() => updateStatus(order._id, 'Delivered')}>Deliver</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* View Details Side Drawer */}
      {selectedOrder && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedOrder(null)}></div>
          <div className="order-drawer">
            <div className="drawer-header">
              <h3>Order {selectedOrder.order_id}</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="drawer-content printable-receipt">
              <div className="receipt-header">
                <h2>NutimetryOrganic</h2>
                <p>Order Receipt</p>
                <p>Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="detail-group">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                <p><strong>Address:</strong> {selectedOrder.address}</p>
                {selectedOrder.notes && <p><strong>Notes:</strong> {selectedOrder.notes}</p>}
              </div>

              <div className="detail-group">
                <h4>Items Ordered</h4>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price_at_purchase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="detail-group">
                <h4>Status History</h4>
                <ul className="status-timeline">
                  {selectedOrder.status_history?.map((sh, i) => (
                    <li key={i}><strong>{sh.status}</strong> - {new Date(sh.timestamp).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="drawer-actions hide-print">
              <button className="btn btn-outline" onClick={handlePrint}>Print Receipt</button>
              <a 
                href={`https://wa.me/91${selectedOrder.phone}?text=${encodeURIComponent(`నమస్కారం! మీ ఆర్డర్ ${selectedOrder.order_id} స్వీకరించబడింది.`)}`}
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary"
                style={{ background: '#25D366', color: 'white', border: 'none' }}
              >
                WhatsApp Customer
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
