import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Eye, X, FileText } from 'lucide-react';

const Nurses = () => {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState(null);

  const fetchNurses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/nurses`);
      if (response.data.success) {
        setNurses(response.data.nurses);
      }
    } catch (error) {
      console.error('Error fetching nurses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurses();
  }, []);

  const toggleApproval = async (id, currentStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/nurses/${id}/approve`, {
        isApproved: !currentStatus
      });
      fetchNurses();
    } catch (error) {
      console.error('Error updating nurse:', error);
    }
  };

  if (loading) return <div>Loading nurses...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Nurses Directory</h1>
          <p className="text-muted mt-2">Manage and approve nurses for deployment.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nurses.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No nurses found</td></tr>
            ) : nurses.map(nurse => (
              <tr key={nurse._id}>
                <td>{nurse.nurseId}</td>
                <td className="font-bold">{nurse.name || 'N/A'}</td>
                <td>{nurse.phone}</td>
                <td>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    backgroundColor: nurse.isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: nurse.isApproved ? '#10B981' : '#F59E0B'
                  }}>
                    {nurse.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => setSelectedNurse(nurse)}
                    >
                      <Eye size={14}/> View
                    </button>
                    <button 
                      className={`btn ${nurse.isApproved ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => toggleApproval(nurse._id, nurse.isApproved)}
                    >
                      {nurse.isApproved ? <><XCircle size={14}/> Revoke</> : <><CheckCircle size={14}/> Approve</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedNurse && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Nurse Details</h3>
              <button onClick={() => setSelectedNurse(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="flex gap-6 mb-6">
              {selectedNurse.profilePicture ? (
                <img src={selectedNurse.profilePicture} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No Pic
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold">{selectedNurse.name || 'Unnamed'} ({selectedNurse.nurseId})</h4>
                <p className="text-muted">{selectedNurse.email || 'No email'} | {selectedNurse.phone}</p>
                <p className="text-muted mt-1">{selectedNurse.age || '--'} years | {selectedNurse.sex || '--'}</p>
                <div className="mt-2">
                  <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      backgroundColor: selectedNurse.isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: selectedNurse.isApproved ? '#10B981' : '#F59E0B'
                    }}>
                      {selectedNurse.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold mb-2">Qualifications & Specializations</h4>
              <p className="text-muted"><span style={{ color: 'var(--text-light)' }}>Qualifications:</span> {selectedNurse.qualifications?.join(', ') || 'N/A'}</p>
              <p className="text-muted mt-1"><span style={{ color: 'var(--text-light)' }}>Specializations:</span> {selectedNurse.specializations?.join(', ') || 'N/A'}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-bold mb-4">Uploaded Documents</h4>
              {(!selectedNurse.documents || selectedNurse.documents.length === 0) ? (
                <p className="text-muted">No documents uploaded.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {selectedNurse.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <div className="glass-card flex items-center gap-3" style={{ padding: '12px' }}>
                        <FileText size={24} color="var(--primary)" />
                        <div>
                          <div className="font-bold" style={{ textTransform: 'capitalize', color: 'white', fontSize: '0.9rem' }}>
                            {doc.type.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to view</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button 
                className={`btn ${selectedNurse.isApproved ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={() => {
                  toggleApproval(selectedNurse._id, selectedNurse.isApproved);
                  setSelectedNurse({...selectedNurse, isApproved: !selectedNurse.isApproved});
                }}
              >
                {selectedNurse.isApproved ? <><XCircle size={18}/> Revoke Approval</> : <><CheckCircle size={18}/> Approve Nurse</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nurses;
