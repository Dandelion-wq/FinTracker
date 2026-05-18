const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/change-password', authMiddleware, userController.changePassword);
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;