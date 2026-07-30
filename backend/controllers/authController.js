import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { username, email, password, codeforcesUsername, leetcodeUsername } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please add all required fields' });
    }

    // Check if user exists (by email or username)
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // pre-save mongoose middleware hashes this
      codeforcesUsername: codeforcesUsername || '',
      leetcodeUsername: leetcodeUsername || '',
      profilePicture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        codeforcesUsername: user.codeforcesUsername,
        leetcodeUsername: user.leetcodeUsername,
        rating: user.rating,
        wins: user.wins,
        losses: user.losses,
        streak: user.streak,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password' });
    }

    // Check for user by email OR username
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }]
    });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register or check your credentials.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password. Please try again.' });
    }


    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      codeforcesUsername: user.codeforcesUsername,
      leetcodeUsername: user.leetcodeUsername,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      streak: user.streak,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Log out user
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res) => {
  // Stateless JWT doesn't require backend state changes, just return success
  res.json({ success: true, message: 'Logged out successfully' });
};
