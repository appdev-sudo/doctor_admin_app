import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArchiveRestore, Trash2 } from 'lucide-react';

const ArchivedRecords = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchives = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/archives`);
      if (response.data.success) {
        setArchives(response.data.archives);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleRestore = async (archiveId) => {
    if (!window.confirm("Are you sure you want to restore this record back to its original collection?")) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/archives/${archiveId}/restore`);
      if (response.data.success) {
        alert('Record restored successfully!');
        fetchArchives();
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Error restoring record: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  if (loading) return <div>Loading archives...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Archived Records</h1>
          <p className="text-muted mt-2">View and restore deleted nurses, bookings, and subscriptions.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Original ID</th>
              <th>Details Snippet</th>
              <th>Deleted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {archives.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No archived records found</td></tr>
            ) : archives.map(archive => {
              // Create a snippet based on the collection type
              let snippet = "Unknown Data";
              const data = archive.documentData || {};
              if (archive.originalCollection === 'Nurse') {
                snippet = `${data.name || 'No Name'} (${data.email || 'No Email'})`;
              } else if (archive.originalCollection === 'Booking') {
                snippet = `${data.serviceTitle || 'Service'} for ${data.user?.name || 'User'}`;
              } else if (archive.originalCollection === 'Subscription') {
                snippet = `${data.serviceTitle || 'Subscription'} (${data.totalSessions} sessions)`;
              }

              return (
                <tr key={archive._id}>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(107, 114, 128, 0.2)',
                      color: '#9CA3AF'
                    }}>
                      {archive.originalCollection}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{archive.originalId}</td>
                  <td>{snippet}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(archive.deletedAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#3B82F6', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                      onClick={() => handleRestore(archive._id)}
                    >
                      <ArchiveRestore size={14} /> Restore
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchivedRecords;
