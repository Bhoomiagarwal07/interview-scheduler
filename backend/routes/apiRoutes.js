const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');
const publicCtrl = require('../controllers/publicController');
const { requireAuthApi } = require('../middleware/auth');

router.post('/drives/:driveId/bookings', requireAuthApi, bookingCtrl.createBooking);
router.delete('/bookings/:id', requireAuthApi, bookingCtrl.cancelBooking);

router.get('/public/drives', publicCtrl.listDrives);
router.get('/public/schedule', publicCtrl.getSchedule);

module.exports = router;
