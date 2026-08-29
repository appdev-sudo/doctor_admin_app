import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Stethoscope, X } from 'lucide-react';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ show: false, bookingId: null });

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/admin/bookings');
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/admin/nurses');
      if (response.data.success) {
        setNurses(response.data.nurses.filter(n => n.isApproved && n.isActive));
      }
    } catch (error) {
      console.error('Error fetching nurses:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchNurses();
  }, []);

  const openAssignModal = (bookingId) => {
    setAssignModal({ show: true, bookingId });
  };

  const closeAssignModal = () => {
    setAssignModal({ show: false, bookingId: null });
  };

  const assignNurse = async (nurseId) => {
    try {
      await axios.post(`http://localhost:4000/api/admin/bookings/${assignModal.bookingId}/assign`, {
        nurseId
      });
      closeAssignModal();
      fetchBookings();
    } catch (error) {
      console.error('Error assigning nurse:', error);
      alert('Error assigning nurse');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' };
      case 'assigned': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
      case 'in_progress': return { bg: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' };
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10B981' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' };
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl">Bookings Management</h1>
        <p className="text-muted mt-2">Track customer bookings and dispatch nurses.</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Assigned Nurse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found</td></tr>
            ) : bookings.map(booking => {
              const statusStyle = getStatusColor(booking.status);
              return (
                <tr key={booking._id}>
                  <td>
                    <div className="font-bold">{booking.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.user?.phone}</div>
                  </td>
                  <td className="font-bold">{booking.serviceTitle}</td>
                  <td>
                    <div>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.preferredTimeSlot}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      textTransform: 'capitalize'
                    }}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{booking.nurse ? booking.nurse.name : <span className="text-muted">Unassigned</span>}</td>
                  <td>
                    {['pending', 'assigned', 'rejected'].includes(booking.status) && (
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => openAssignModal(booking._id)}
                      >
                        <Stethoscope size={14} /> Assign Nurse
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {assignModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-card" style={{ width: '500px', background: 'var(--bg-dark)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Assign Nurse</h3>
              <button onClick={closeAssignModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {nurses.length === 0 ? (
                <p className="text-muted">No active/approved nurses available.</p>
              ) : nurses.map(nurse => (
                <div key={nurse._id} className="flex justify-between items-center mb-4" style={{ padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <div>
                    <div className="font-bold">{nurse.name || 'Unnamed'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {nurse.nurseId}</div>
                  </div>
                  <button className="btn btn-secondary" onClick={() => assignNurse(nurse._id)}>
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
