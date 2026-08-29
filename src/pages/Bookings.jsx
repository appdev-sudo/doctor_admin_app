import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Stethoscope, X, Eye, ClipboardList, Activity } from 'lucide-react';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ show: false, bookingId: null });
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings`);
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
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/nurses`);
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
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings/${assignModal.bookingId}/assign`, {
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
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye size={14} /> View
                      </button>
                      {['pending', 'assigned', 'rejected'].includes(booking.status) && (
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => openAssignModal(booking._id)}
                        >
                          <Stethoscope size={14} /> Assign
                        </button>
                      )}
                    </div>
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
      {selectedBooking && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList color="var(--primary)" /> Booking Details
                </h3>
                <p className="text-muted mt-1">ID: {selectedBooking._id}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Left Column */}
              <div>
                <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>Customer & Service</h4>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <p><strong>Customer:</strong> {selectedBooking.user?.name || 'Unknown'}</p>
                  <p><strong>Phone:</strong> {selectedBooking.user?.phone}</p>
                  <p style={{ marginTop: '8px' }}><strong>Service:</strong> {selectedBooking.serviceTitle}</p>
                  <p><strong>Preferred Slot:</strong> {selectedBooking.preferredDate ? new Date(selectedBooking.preferredDate).toLocaleDateString() : 'N/A'} at {selectedBooking.preferredTimeSlot}</p>
                  <p style={{ marginTop: '8px' }}><strong>Address:</strong> {selectedBooking.address?.formattedAddress || `${selectedBooking.address?.street}, ${selectedBooking.address?.city}`}</p>
                </div>
                
                <h4 className="font-bold mb-3 mt-6 text-lg" style={{ color: 'var(--primary)' }}>Status & Payment</h4>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Status: </strong> 
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                      backgroundColor: getStatusColor(selectedBooking.status).bg,
                      color: getStatusColor(selectedBooking.status).color
                    }}>
                      {selectedBooking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  <p style={{ marginTop: '8px' }}><strong>Payment:</strong> <span style={{ color: selectedBooking.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }}>{selectedBooking.paymentStatus.toUpperCase()}</span></p>
                  {selectedBooking.paymentId && <p><strong>Payment ID:</strong> {selectedBooking.paymentId}</p>}
                  <p style={{ marginTop: '8px' }}><strong>Assigned Nurse:</strong> {selectedBooking.nurse?.name || 'Unassigned'}</p>
                  <p><strong>Consent Signed:</strong> {selectedBooking.consentSigned ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>Timeline</h4>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <p><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                  {selectedBooking.startedAt && <p><strong>Started:</strong> {new Date(selectedBooking.startedAt).toLocaleString()}</p>}
                  {selectedBooking.completedAt && <p><strong>Completed:</strong> {new Date(selectedBooking.completedAt).toLocaleString()}</p>}
                </div>

                {selectedBooking.adminChart && (
                  <>
                    <h4 className="font-bold mb-3 mt-6 text-lg flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                      <Activity size={18} /> Medical Vitals
                    </h4>
                    <div className="glass-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <p><strong>BP:</strong> {selectedBooking.adminChart.bloodPressure || '--'} mmHg</p>
                      <p><strong>HR:</strong> {selectedBooking.adminChart.heartRate || '--'} bpm</p>
                      <p><strong>Temp:</strong> {selectedBooking.adminChart.temperature || '--'} °F</p>
                      <p><strong>SpO2:</strong> {selectedBooking.adminChart.spo2 || '--'} %</p>
                      <p><strong>Weight:</strong> {selectedBooking.adminChart.weight || '--'} kg</p>
                      {selectedBooking.adminChart.notes && (
                        <p style={{ gridColumn: '1 / span 2', marginTop: '8px' }}><strong>Notes:</strong> {selectedBooking.adminChart.notes}</p>
                      )}
                    </div>
                  </>
                )}

                {selectedBooking.feedback && (
                  <>
                    <h4 className="font-bold mb-3 mt-6 text-lg" style={{ color: 'var(--primary)' }}>Feedback</h4>
                    <div className="glass-card" style={{ padding: '16px' }}>
                      <p><strong>Rating:</strong> {'⭐'.repeat(selectedBooking.feedback.rating)}{'☆'.repeat(5-selectedBooking.feedback.rating)}</p>
                      {selectedBooking.feedback.comments && <p><strong>Comments:</strong> "{selectedBooking.feedback.comments}"</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
