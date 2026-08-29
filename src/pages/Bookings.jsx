import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Stethoscope, X, Eye, ClipboardList, Activity, Plus } from 'lucide-react';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ show: false, bookingId: null });
  const [scheduleModal, setScheduleModal] = useState({ show: false, booking: null });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [offlineModal, setOfflineModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', age: '', sex: 'Male',
    serviceId: '', preferredDate: '', preferredTimeSlot: '10:00 AM',
    street: '', city: '', state: '', pincode: '', nurseId: '', paymentStatus: 'pending'
  });

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

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/services`);
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchNurses();
    fetchServices();
  }, []);

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offline-booking`, formData);
      if (response.data.success) {
        setOfflineModal(false);
        setFormData({
          name: '', phone: '', email: '', age: '', sex: 'Male',
          serviceId: '', preferredDate: '', preferredTimeSlot: '10:00 AM',
          street: '', city: '', state: '', pincode: '', nurseId: '', paymentStatus: 'pending'
        });
        fetchBookings();
      }
    } catch (error) {
      console.error('Offline booking error:', error);
      alert('Failed to create booking: ' + (error.response?.data?.message || 'Server error'));
    }
  };

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

  const toggleLocation = async (bookingId, newLocation) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings/${bookingId}/location`, {
        locationType: newLocation
      });
      fetchBookings();
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, locationType: newLocation }));
      }
    } catch (error) {
      console.error('Error toggling location:', error);
      alert('Error updating location');
    }
  };

  const completeClinicSession = async (bookingId) => {
    if (!window.confirm("Are you sure you want to mark this clinic session as completed?")) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings/${bookingId}/complete-clinic`);
      fetchBookings();
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error completing clinic session:', error);
      alert('Error completing session');
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

  const updateSchedule = async (e) => {
    e.preventDefault();
    try {
      const form = e.target;
      const data = {
        preferredDate: form.date.value || null,
        preferredTimeSlot: form.time.value || null,
      };
      if (scheduleModal.booking.locationType !== 'clinic') {
        data.address = {
          street: form.street.value,
          city: form.city.value,
          state: form.state.value,
          pincode: form.pincode.value,
        };
      }
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings/${scheduleModal.booking._id}/schedule`, data);
      setScheduleModal({ show: false, booking: null });
      fetchBookings();
      if (selectedBooking && selectedBooking._id === scheduleModal.booking._id) {
        setSelectedBooking({
          ...selectedBooking,
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot,
          ...(data.address ? { address: { ...selectedBooking.address, ...data.address } } : {})
        });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule');
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Bookings Management</h1>
          <p className="text-muted mt-2">Track customer bookings and dispatch nurses.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setOfflineModal(true)}
        >
          <Plus size={18} /> New Offline Booking
        </button>
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
                  <td className="font-bold">
                    {booking.serviceTitle}
                    {booking.isSubscriptionSession && booking.sessionName && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', marginTop: '2px' }}>
                        Session: {booking.sessionName}
                      </div>
                    )}
                  </td>
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
                      
                      {booking.locationType === 'clinic' ? (
                         ['pending', 'assigned'].includes(booking.status) && (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10B981', borderColor: '#10B981' }}
                            onClick={() => completeClinicSession(booking._id)}
                          >
                            Mark Completed
                          </button>
                         )
                      ) : (
                         ['pending', 'assigned', 'rejected'].includes(booking.status) && (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            onClick={() => openAssignModal(booking._id)}
                          >
                            <Stethoscope size={14} /> Assign
                          </button>
                        )
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
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span><strong>Preferred Slot:</strong> {selectedBooking.preferredDate ? new Date(selectedBooking.preferredDate).toLocaleDateString() : 'N/A'} at {selectedBooking.preferredTimeSlot}</span>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setScheduleModal({ show: true, booking: selectedBooking })}>Edit</button>
                  </p>
                  <p style={{ marginTop: '8px' }}><strong>Address:</strong> {selectedBooking.address?.formattedAddress || `${selectedBooking.address?.street || ''}, ${selectedBooking.address?.city || ''}`}</p>
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
                  {selectedBooking.startOtp && <p style={{ marginTop: '8px' }}><strong>Start OTP:</strong> <span style={{ color: '#F59E0B', letterSpacing: '2px', fontWeight: 'bold' }}>{selectedBooking.startOtp}</span></p>}
                  {selectedBooking.endOtp && <p style={{ marginTop: '8px' }}><strong>End OTP:</strong> <span style={{ color: '#60A5FA', letterSpacing: '2px', fontWeight: 'bold' }}>{selectedBooking.endOtp}</span></p>}
                  
                  <p style={{ marginTop: '8px' }}><strong>Payment:</strong> <span style={{ color: selectedBooking.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }}>{selectedBooking.paymentStatus.toUpperCase()}</span></p>
                  {selectedBooking.paymentId && <p><strong>Payment ID:</strong> {selectedBooking.paymentId}</p>}
                  
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong>Location Type:</strong>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                        backgroundColor: selectedBooking.locationType === 'clinic' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: selectedBooking.locationType === 'clinic' ? '#3B82F6' : '#8B5CF6'
                      }}>
                        {selectedBooking.locationType ? selectedBooking.locationType.toUpperCase() : 'HOME'}
                      </span>
                    </p>
                    {['pending', 'assigned'].includes(selectedBooking.status) && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          className={`btn ${selectedBooking.locationType !== 'clinic' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}
                          onClick={() => toggleLocation(selectedBooking._id, 'home')}
                        >
                          Set Home
                        </button>
                        <button 
                          className={`btn ${selectedBooking.locationType === 'clinic' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}
                          onClick={() => toggleLocation(selectedBooking._id, 'clinic')}
                        >
                          Set Clinic
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedBooking.locationType !== 'clinic' && (
                    <p style={{ marginTop: '16px' }}><strong>Assigned Nurse:</strong> {selectedBooking.nurse?.name || 'Unassigned'}</p>
                  )}
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

                {selectedBooking.adminCharts && selectedBooking.adminCharts.length > 0 && (
                  <>
                    <h4 className="font-bold mb-3 mt-6 text-lg flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                      <Activity size={18} /> Medical Vitals
                    </h4>
                    {selectedBooking.adminCharts.map((chart, idx) => (
                      <div key={idx} className="glass-card mb-3" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <p style={{ gridColumn: '1 / span 2', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Recorded: {new Date(chart.recordedAt).toLocaleString()}
                        </p>
                        <p><strong>BP:</strong> {chart.bloodPressure || '--'} mmHg</p>
                        <p><strong>HR:</strong> {chart.heartRate || '--'} bpm</p>
                        <p><strong>SpO2:</strong> {chart.spo2 || '--'} %</p>
                        {chart.notes && (
                          <p style={{ gridColumn: '1 / span 2', marginTop: '4px' }}><strong>Notes:</strong> {chart.notes}</p>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {selectedBooking.expenses && selectedBooking.expenses.length > 0 && (
                  <>
                    <h4 className="font-bold mb-3 mt-6 text-lg flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                      Expenses
                    </h4>
                    {selectedBooking.expenses.map((exp, idx) => (
                      <div key={idx} className="glass-card mb-3" style={{ padding: '12px' }}>
                        <div className="flex justify-between items-center mb-1">
                          <strong>{exp.name}</strong>
                          <span style={{ color: '#10B981', fontWeight: 'bold' }}>Rs. {exp.price.toFixed(2)}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.type}</p>
                        {exp.receiptUrl && (
                          <a href={exp.receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                            View Receipt
                          </a>
                        )}
                      </div>
                    ))}
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

      {scheduleModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80
        }}>
          <div className="glass-card" style={{ width: '500px', background: 'var(--bg-dark)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Edit Schedule</h3>
              <button onClick={() => setScheduleModal({ show: false, booking: null })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={updateSchedule}>
              <div className="input-group">
                <label>Date</label>
                <input type="date" name="date" className="glass-input" defaultValue={scheduleModal.booking.preferredDate ? new Date(scheduleModal.booking.preferredDate).toISOString().split('T')[0] : ''} />
              </div>
              <div className="input-group">
                <label>Time</label>
                <select name="time" className="glass-input" defaultValue={scheduleModal.booking.preferredTimeSlot || ''}>
                  <option value="">-- None --</option>
                  <option>08:00 AM</option><option>09:00 AM</option><option>10:00 AM</option>
                  <option>11:00 AM</option><option>12:00 PM</option><option>01:00 PM</option>
                  <option>02:00 PM</option><option>03:00 PM</option><option>04:00 PM</option>
                  <option>05:00 PM</option><option>06:00 PM</option>
                </select>
              </div>

              {scheduleModal.booking.locationType !== 'clinic' && (
                <>
                  <h4 className="font-bold mt-4 mb-2" style={{ color: 'var(--primary)' }}>Address</h4>
                  <div className="input-group">
                    <label>Street/Landmark</label>
                    <input type="text" name="street" className="glass-input" defaultValue={scheduleModal.booking.address?.street || ''} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                      <label>City</label>
                      <input type="text" name="city" className="glass-input" defaultValue={scheduleModal.booking.address?.city || ''} />
                    </div>
                    <div className="input-group">
                      <label>State</label>
                      <input type="text" name="state" className="glass-input" defaultValue={scheduleModal.booking.address?.state || ''} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Pincode</label>
                    <input type="text" name="pincode" className="glass-input" defaultValue={scheduleModal.booking.address?.pincode || ''} />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setScheduleModal({ show: false, booking: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFLINE BOOKING MODAL */}
      {offlineModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-2xl font-bold text-white">Create Offline Booking</h3>
              <button onClick={() => setOfflineModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleOfflineSubmit}>
              {/* Customer Details */}
              <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>1. Customer Details</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group">
                  <label>Phone Number *</label>
                  <input type="text" className="glass-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +919876543210" />
                </div>
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" className="glass-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" className="glass-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>Age</label>
                    <input type="number" className="glass-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Sex</label>
                    <select className="glass-input" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service & Schedule */}
              <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>2. Service & Schedule</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group" style={{ gridColumn: '1 / span 2', marginBottom: 0 }}>
                  <label>Select Service *</label>
                  <select className="glass-input" required value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})}>
                    <option value="">-- Choose a Service --</option>
                    {services.map(s => (
                      <option key={s._id} value={s.serviceId}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Preferred Date</label>
                  <input type="date" className="glass-input" value={formData.preferredDate} onChange={e => setFormData({...formData, preferredDate: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Preferred Time</label>
                  <select className="glass-input" value={formData.preferredTimeSlot} onChange={e => setFormData({...formData, preferredTimeSlot: e.target.value})}>
                    <option>08:00 AM</option><option>10:00 AM</option><option>12:00 PM</option>
                    <option>02:00 PM</option><option>04:00 PM</option><option>06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>3. Address</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group" style={{ gridColumn: '1 / span 2', marginBottom: 0 }}>
                  <label>Street / Landmark</label>
                  <input type="text" className="glass-input" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>City</label>
                  <input type="text" className="glass-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>State</label>
                    <input type="text" className="glass-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Pincode</label>
                    <input type="text" className="glass-input" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Assignment & Payment */}
              <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--primary)' }}>4. Assignment & Payment (Optional)</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Assign Nurse Now</label>
                  <select className="glass-input" value={formData.nurseId} onChange={e => setFormData({...formData, nurseId: e.target.value})}>
                    <option value="">-- Leave Unassigned --</option>
                    {nurses.map(n => (
                      <option key={n._id} value={n._id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Payment Status</label>
                  <select className="glass-input" value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="paid">Completed (Paid)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOfflineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
