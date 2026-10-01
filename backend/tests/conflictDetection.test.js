// backend/tests/conflictDetection.test.js
//
// HOW TO RUN (no installation needed, Node 18+):
//   cd backend
//   node --test
//
// This uses Node's BUILT-IN test runner, so you don't need Jest or any package.
// These tests only check pure functions (no database, no server), so they
// run in under a second.

const test = require('node:test');      // test(name, fn) defines one test
const assert = require('node:assert');  // assert.strictEqual(actual, expected) checks a result

// Import the two REAL functions from your code (the same ones the booking
// controller uses), so we are testing the real thing, not a copy.
const { rangesOverlap, checkConflict } = require('../utils/conflictDetection');

// Small helper so the tests are easy to read.
// Your code calls new Date(...) on its inputs, so ISO strings work fine.
// Example: t('09:20') -> '2026-10-10T09:20:00'
const t = (hhmm) => `2026-10-10T${hhmm}:00`;

// ===========================================================================
// PART 1: rangesOverlap(startA, endA, startB, endB)
// Rule in your code: overlap <=> startA < endB AND endA > startB
// ===========================================================================

// TEST 1: Partial overlap -> conflict.
// A is 09:00-09:20, B is 09:10-09:30. B starts while A is still running.
test('rangesOverlap: partial overlap is a conflict', () => {
  assert.strictEqual(rangesOverlap(t('09:00'), t('09:20'), t('09:10'), t('09:30')), true);
});

// TEST 2: Back-to-back -> NOT a conflict.
// A ends at 09:20 and B starts at 09:20. They only touch.
// This proves you used strict < and > (not <= / >=), so back-to-back
// interviews are allowed.
test('rangesOverlap: back-to-back slots are NOT a conflict', () => {
  assert.strictEqual(rangesOverlap(t('09:00'), t('09:20'), t('09:20'), t('09:40')), false);
});

// TEST 3: Same boundary, other direction (B comes first).
test('rangesOverlap: back-to-back works in both directions', () => {
  assert.strictEqual(rangesOverlap(t('09:20'), t('09:40'), t('09:00'), t('09:20')), false);
});

// TEST 4: One range fully inside another -> conflict.
// B (09:10-09:20) sits entirely inside A (09:00-10:00).
test('rangesOverlap: a range fully inside another is a conflict', () => {
  assert.strictEqual(rangesOverlap(t('09:00'), t('10:00'), t('09:10'), t('09:20')), true);
});

// TEST 5: Identical ranges -> conflict.
test('rangesOverlap: identical ranges are a conflict', () => {
  assert.strictEqual(rangesOverlap(t('09:00'), t('09:20'), t('09:00'), t('09:20')), true);
});

// TEST 6: Far apart -> not a conflict.
test('rangesOverlap: ranges with a gap are NOT a conflict', () => {
  assert.strictEqual(rangesOverlap(t('09:00'), t('09:20'), t('11:00'), t('11:20')), false);
});

// TEST 7: Order should not matter (overlap is symmetric).
test('rangesOverlap: same answer whichever range is passed first', () => {
  const ab = rangesOverlap(t('09:00'), t('09:30'), t('09:15'), t('09:45'));
  const ba = rangesOverlap(t('09:15'), t('09:45'), t('09:00'), t('09:30'));
  assert.strictEqual(ab, ba);
  assert.strictEqual(ab, true);
});

// ===========================================================================
// PART 2: checkConflict(existingBookings, newSlot, roomId)
// Returns { conflict: true/false, reason: string or null }
// ===========================================================================

// TEST 8: No existing bookings -> no conflict.
test('checkConflict: empty bookings list means no conflict', () => {
  const result = checkConflict([], { start_time: t('09:00'), end_time: t('09:20') }, 1);
  assert.deepStrictEqual(result, { conflict: false, reason: null });
});

// TEST 9: Overlap in the SAME room -> room message.
test('checkConflict: overlap in the same room gives the room reason', () => {
  const existing = [{ start_time: t('09:00'), end_time: t('09:20'), room_id: 1 }];
  const result = checkConflict(existing, { start_time: t('09:10'), end_time: t('09:30') }, 1);
  assert.strictEqual(result.conflict, true);
  assert.strictEqual(result.reason, 'Room is already booked for an overlapping time.');
});

// TEST 10: Overlap in a DIFFERENT room -> "person already busy" message.
test('checkConflict: overlap in a different room gives the person reason', () => {
  const existing = [{ start_time: t('09:00'), end_time: t('09:20'), room_id: 2 }];
  const result = checkConflict(existing, { start_time: t('09:10'), end_time: t('09:30') }, 1);
  assert.strictEqual(result.conflict, true);
  assert.strictEqual(result.reason, 'This person already has an overlapping interview scheduled.');
});

// TEST 11: Back-to-back bookings are allowed.
test('checkConflict: back-to-back booking is allowed', () => {
  const existing = [{ start_time: t('09:00'), end_time: t('09:20'), room_id: 1 }];
  const result = checkConflict(existing, { start_time: t('09:20'), end_time: t('09:40') }, 1);
  assert.strictEqual(result.conflict, false);
});

// TEST 12: THE KEY TEST for why you use overlap logic instead of slot_id.
// A long 45-minute slot (09:00-09:45) and a short 15-minute slot (09:30-09:45)
// are DIFFERENT slot rows, so comparing slot ids would say "no conflict".
// The overlap check correctly catches it.
test('checkConflict: different-duration slots that overlap are caught', () => {
  const existing = [{ start_time: t('09:00'), end_time: t('09:45'), room_id: 1 }];
  const result = checkConflict(existing, { start_time: t('09:30'), end_time: t('09:45') }, 2);
  assert.strictEqual(result.conflict, true);
});

// TEST 13: A conflict later in the list is still found.
// The loop must keep checking, not stop after the first non-overlapping booking.
test('checkConflict: finds a conflict that is not the first booking in the list', () => {
  const existing = [
    { start_time: t('08:00'), end_time: t('08:20'), room_id: 1 }, // no overlap
    { start_time: t('09:00'), end_time: t('09:20'), room_id: 1 }, // overlaps
  ];
  const result = checkConflict(existing, { start_time: t('09:10'), end_time: t('09:30') }, 1);
  assert.strictEqual(result.conflict, true);
});