import express from 'express';
import { getRecentMatches, getMatchDetails, analyzeMatchCode } from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recent', getRecentMatches);
router.post('/analyze', protect, analyzeMatchCode);
router.get('/:id', protect, getMatchDetails);

export default router;

