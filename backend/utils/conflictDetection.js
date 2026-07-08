/**
 * Conflict Detection for Interview Booking
 * -----------------------------------------
 * Problem: when assigning a candidate + interviewer to a room and time slot,
 * we must guarantee that:
 *   1. The room is free for that exact slot.
 *   2. The interviewer has no OTHER booking whose time range overlaps this slot.
 *   3. The candidate has no OTHER booking whose time range overlaps this slot.
 *
 * Why "overlap" and not just "same slot_id"?
 * Slots in this system can have different durations (e.g. a technical round
 * might be 45 minutes while an HR round is 15 minutes), so two different
 * slot rows can still represent overlapping time windows. Checking only
 * slot_id equality would miss those cases. This uses the classic interval
 * overlap check used in calendar systems:
 *
 *      overlap  <=>  (startA < endB) AND (endA > startB)
 *
 * Time complexity: O(k) per check, where k = number of existing bookings
 * for that interviewer/candidate in the drive (in practice k is small,
 * bounded by how many interviews one person can realistically have in a day).
 */

function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

/**
 * Checks whether assigning `newSlot` to a given interviewer/candidate/room
 * would create a conflict with any of their existing active bookings.
 *
 * @param {Array} existingBookings - rows with { start_time, end_time, room_id }
 * @param {{start_time: string, end_time: string}} newSlot
 * @param {number} roomId - the room being requested for the new booking
 * @returns {{conflict: boolean, reason: string|null}}
 */
function checkConflict(existingBookings, newSlot, roomId) {
  for (const booking of existingBookings) {
    const overlaps = rangesOverlap(
      newSlot.start_time,
      newSlot.end_time,
      booking.start_time,
      booking.end_time
    );

    if (overlaps) {
      if (booking.room_id === roomId) {
        return { conflict: true, reason: 'Room is already booked for an overlapping time.' };
      }
      return { conflict: true, reason: 'This person already has an overlapping interview scheduled.' };
    }
  }

  return { conflict: false, reason: null };
}

module.exports = { rangesOverlap, checkConflict };
