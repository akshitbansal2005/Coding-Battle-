import Match from '../models/Match.js';
import { analyzeCodeSubmission } from '../services/aiReviewService.js';

/**
 * @desc    Get recent battles globally
 * @route   GET /api/matches/recent
 * @access  Public
 */
export const getRecentMatches = async (req, res) => {
  try {
    const matches = await Match.find({ status: 'finished' })
      .populate('player1', 'username profilePicture rating')
      .populate('player2', 'username profilePicture rating')
      .populate('winner', 'username')
      .populate('problem', 'title difficulty platform topic')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get details of a specific match
 * @route   GET /api/matches/:id
 * @access  Private
 */
export const getMatchDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const match = await Match.findById(id)
      .populate('player1', 'username profilePicture rating')
      .populate('player2', 'username profilePicture rating')
      .populate('winner', 'username')
      .populate('problem');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    AI Code Review & Breakdown for a match submission
 * @route   POST /api/matches/analyze
 * @access  Private
 */
export const analyzeMatchCode = async (req, res) => {
  const { code, language, problemTitle, difficulty, topic } = req.body;

  try {
    const analysis = await analyzeCodeSubmission({
      code,
      language,
      problemTitle,
      difficulty,
      topic,
    });

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

