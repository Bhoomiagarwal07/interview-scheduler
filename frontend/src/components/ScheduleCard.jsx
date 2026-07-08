const ScheduleCard = ({ booking, role }) => {
  const start = new Date(booking.start_time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = new Date(booking.end_time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card p-3 mb-2 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <span className="badge bg-primary-subtle text-primary mb-1">
            {start} - {end}
          </span>
          <h6 className="mb-0 mt-1">
            <i className="bi bi-door-open me-1"></i>
            {booking.room_name}
          </h6>
        </div>
        <div className="text-end small text-muted">
          {role === 'candidate' ? (
            <span>
              <i className="bi bi-person-badge"></i> Interviewer: <strong>{booking.interviewer_name}</strong>
            </span>
          ) : (
            <span>
              <i className="bi bi-person"></i> Candidate: <strong>{booking.candidate_name}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
