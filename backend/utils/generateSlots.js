/**
 * Generates a list of equal-duration time slots between a start and end
 * time. Used when an admin sets up a drive, e.g. "9 AM to 5 PM, 20-minute
 * slots" produces 24 slots.
 *
 * @param {string} driveDate - 'YYYY-MM-DD'
 * @param {string} startTime - 'HH:MM' (24hr)
 * @param {string} endTime - 'HH:MM' (24hr)
 * @param {number} durationMinutes
 * @returns {Array<{start_time: Date, end_time: Date}>}
 */
function generateSlots(driveDate, startTime, endTime, durationMinutes) {
  const slots = [];
  let current = new Date(`${driveDate}T${startTime}:00`);
  const end = new Date(`${driveDate}T${endTime}:00`);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
    if (slotEnd > end) break;
    slots.push({ start_time: new Date(current), end_time: slotEnd });
    current = slotEnd;
  }

  return slots;
}

module.exports = generateSlots;
