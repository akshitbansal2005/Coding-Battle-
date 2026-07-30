import express from 'express';
import { getUserMe, getUserProfile, getLeaderboard, updateAvatar, getNotifications } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getUserMe);
router.get('/me/notifications', protect, getNotifications);
router.patch('/me/avatar', protect, updateAvatar);
router.get('/profile/:username', getUserProfile);
router.get('/leaderboard', getLeaderboard);

export default router;
