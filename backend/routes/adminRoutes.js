const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/adminAuthController');
const driveCtrl = require('../controllers/driveController');
const { requireAuth } = require('../middleware/auth');

router.get('/login', authCtrl.showLogin);
router.post('/login', authCtrl.login);
router.get('/register', authCtrl.showRegister);
router.post('/register', authCtrl.register);
router.get('/logout', authCtrl.logout);

router.get('/dashboard', requireAuth, driveCtrl.showDashboard);
router.get('/drives/new', requireAuth, driveCtrl.showNewDriveForm);
router.post('/drives', requireAuth, driveCtrl.createDrive);
router.get('/drives/:id', requireAuth, driveCtrl.showDriveDetail);
router.post('/drives/:id/rooms', requireAuth, driveCtrl.addRooms);
router.post('/drives/:id/interviewers', requireAuth, driveCtrl.addInterviewers);
router.post('/drives/:id/candidates', requireAuth, driveCtrl.addCandidates);
router.post('/drives/:id/slots', requireAuth, driveCtrl.createSlots);

module.exports = router;
