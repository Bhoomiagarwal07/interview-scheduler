import { useState, useEffect } from 'react';
import api from './api/axios';
import ScheduleCard from './components/ScheduleCard';

function App() {
  const [drives, setDrives] = useState([]);
  const [driveId, setDriveId] = useState('');
  const [role, setRole] = useState('candidate');
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api
      .get('/public/drives')
      .then(({ data }) => {
        setDrives(data);
        if (data.length > 0) setDriveId(data[0].id);
      })
      .catch(() => setError('Could not load drives. Is the backend running?'));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!driveId || !identifier.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);

    try {
      const { data } = await api.get('/public/schedule', {
        params: { driveId, role, identifier: identifier.trim() },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '600px' }}>
      <div className="text-center mb-4">
        <i className="bi bi-calendar-check text-primary" style={{ fontSize: '2.5rem' }}></i>
        <h3 className="mt-2 mb-1">Check Your Interview Schedule</h3>
        <p className="text-muted small">
          Look up your assigned time slot, room, and interviewer/candidate for any drive.
        </p>
      </div>

      <div className="card p-4 shadow-sm border-0">
        <form onSubmit={handleSearch}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Interview Drive</label>
            <select
              className="form-select"
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              required
            >
              {drives.length === 0 && <option value="">No drives available yet</option>}
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company_name} — {new Date(d.drive_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">I am a</label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${role === 'candidate' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setRole('candidate')}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`btn btn-sm ${role === 'interviewer' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setRole('interviewer')}
              >
                Interviewer
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">
              {role === 'candidate' ? 'Your Roll Number' : 'Your Registered Email'}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={role === 'candidate' ? 'e.g. 21CS045' : 'e.g. you@company.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Searching...' : 'Find My Schedule'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger mt-3 small">{error}</div>}

      {searched && !error && result && (
        <div className="mt-4">
          <h6 className="mb-3">
            Schedule for <span className="text-primary">{result.name}</span>
          </h6>
          {result.bookings.length === 0 ? (
            <p className="text-muted text-center py-4">
              No interview scheduled for you yet. Check back later.
            </p>
          ) : (
            result.bookings.map((b) => <ScheduleCard key={b.id} booking={b} role={role} />)
          )}
        </div>
      )}
    </div>
  );
}

export default App;
