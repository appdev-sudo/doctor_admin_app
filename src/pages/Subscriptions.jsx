import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Stethoscope, X, Eye, ClipboardList, ChevronDown, ChevronRight, Activity } from 'lucide-react';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ show: false, bookingId: null });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [scheduleModal, setScheduleModal] = useState({ show: false, booking: null });
  const [expandedSubs, setExpandedSubs] = useState({});

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/subscriptions`);
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
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
    fetchSubscriptions();
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
      fetchSubscriptions();
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
      fetchSubscriptions();
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
      fetchSubscriptions();
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error completing clinic session:', error);
      alert('Error completing session');
    }
  };

  const updateSchedule = async (e) => {
    e.preventDefault();
    try {
      const form = e.target;
      const data = {
        locationType: scheduleModal.locationType,
        preferredDate: form.date.value || null,
        preferredTimeSlot: form.time.value || null,
      };
      if (scheduleModal.locationType === 'clinic') {
        data.clinicLocation = form.clinicLocation.value;
      } else {
        data.address = {
          street: form.street.value,
          city: form.city.value,
          state: form.state.value,
          pincode: form.pincode.value,
        };
      }
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bookings/${scheduleModal.booking._id}/schedule`, data);
      setScheduleModal({ show: false, booking: null, locationType: 'home' });
      fetchSubscriptions();
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

  const toggleExpand = (subId) => {
    setExpandedSubs(prev => ({ ...prev, [subId]: !prev[subId] }));
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

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Subscriptions Management</h1>
          <p className="text-muted mt-2">Track multi-session subscriptions and individual sessions.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="glass-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Customer</th>
              <th>Subscription</th>
              <th>Progress</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No subscriptions found</td></tr>
            ) : subscriptions.map(sub => {
              const isExpanded = expandedSubs[sub._id];
              return (
                <React.Fragment key={sub._id}>
                  <tr style={{ background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent', cursor: 'pointer' }} onClick={() => toggleExpand(sub._id)}>
                    <td>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td>
                      <div className="font-bold">{sub.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.user?.phone}</div>
                    </td>
                    <td className="font-bold text-lg text-primary">{sub.serviceTitle}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(sub.completedSessions / sub.totalSessions) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{sub.completedSessions}/{sub.totalSessions}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: sub.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }}>{sub.paymentStatus.toUpperCase()}</span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem',
                        backgroundColor: sub.status === 'active' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: sub.status === 'active' ? '#3B82F6' : '#10B981',
                        textTransform: 'capitalize'
                      }}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                  
                  {isExpanded && sub.sessions && sub.sessions.length > 0 && (
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan="6" style={{ padding: '0 0 0 40px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {sub.sessions.map((booking, idx) => {
                              const statusStyle = getStatusColor(booking.status);
                              return (
                                <tr key={booking._id} style={{ borderBottom: idx !== sub.sessions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                  <td style={{ padding: '12px 16px', width: '20%' }}>
                                    <div className="font-bold" style={{ color: 'var(--accent-teal)' }}>{booking.sessionName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {booking.locationType === 'clinic' ? 'CLINIC' : 'HOME'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', width: '20%' }}>
                                    <div>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Unscheduled'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.preferredTimeSlot || ''}</div>
                                  </td>
                                  <td style={{ padding: '12px 16px', width: '15%' }}>
                                    <span style={{ 
                                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                      backgroundColor: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize'
                                    }}>
                                      {booking.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', width: '20%' }}>
                                    {booking.locationType === 'clinic' ? <span className="text-muted">N/A</span> : (booking.nurse ? booking.nurse.name : <span className="text-muted">Unassigned</span>)}
                                  </td>
                                  <td style={{ padding: '12px 16px', width: '25%' }}>
                                    <div className="flex gap-2">
                                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}>
                                        <Eye size={12} /> View
                                      </button>
                                      
                                      {booking.locationType === 'clinic' ? (
                                         ['pending', 'assigned'].includes(booking.status) && (
                                          <button 
                                            className="btn btn-primary"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#10B981', borderColor: '#10B981' }}
                                            onClick={(e) => { e.stopPropagation(); completeClinicSession(booking._id); }}
                                          >
                                            Complete
                                          </button>
                                         )
                                      ) : (
                                         ['pending', 'assigned', 'rejected'].includes(booking.status) && (
                                          <button 
                                            className="btn btn-primary"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                            onClick={(e) => { e.stopPropagation(); openAssignModal(booking._id); }}
                                          >
                                            <Stethoscope size={12} /> Assign
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
                  <ClipboardList color="var(--primary)" /> Session Details
                </h3>
                <p className="text-muted mt-1">ID: {selectedBooking._id} | {selectedBooking.sessionName}</p>
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
                    <div className="flex gap-2">
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setScheduleModal({ show: true, booking: selectedBooking, locationType: selectedBooking.locationType || 'home' })}>Edit</button>
                    </div>
                  </p>
                  <p style={{ marginTop: '8px' }}><strong>Address:</strong> {selectedBooking.address?.formattedAddress || `${selectedBooking.address?.street || ''}, ${selectedBooking.address?.city || ''}`}</p>
                </div>
                
                <h4 className="font-bold mb-3 mt-6 text-lg" style={{ color: 'var(--primary)' }}>Status</h4>
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
              <h3 className="font-bold text-xl">Edit Location & Schedule</h3>
              <button onClick={() => setScheduleModal({ show: false, booking: null, locationType: 'home' })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={updateSchedule} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Location Type</label>
                  <select 
                    className="glass-input" 
                    value={scheduleModal.locationType} 
                    onChange={e => setScheduleModal({...scheduleModal, locationType: e.target.value})}
                  >
                    <option value="home">Home Service</option>
                    <option value="clinic">Clinic Visit</option>
                  </select>
                </div>
                {scheduleModal.locationType === 'clinic' && (
                  <div className="input-group">
                    <label>Select Clinic</label>
                    <select name="clinicLocation" className="glass-input" defaultValue={scheduleModal.booking.clinicLocation || 'Vytalyou Powai'}>
                      <option>Vytalyou Powai</option>
                      <option>Vytalyou Juhu</option>
                      <option>Vytalyou Worli</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" name="date" className="glass-input" defaultValue={scheduleModal.booking.preferredDate ? new Date(scheduleModal.booking.preferredDate).toISOString().split('T')[0] : ''} />
                </div>
                <div className="input-group">
                  <label>Time</label>
                  <select name="time" className="glass-input" defaultValue={scheduleModal.booking.preferredTimeSlot || ''}>
                    <option value="">Any Time</option>
                    <option>08:00 AM</option>
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>12:00 PM</option>
                    <option>01:00 PM</option>
                    <option>02:00 PM</option>
                    <option>03:00 PM</option>
                    <option>04:00 PM</option>
                    <option>05:00 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
              </div>

              {scheduleModal.locationType !== 'clinic' && (
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

              <div className="flex justify-end gap-3 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setScheduleModal({ show: false, booking: null, locationType: 'home' })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
