import User from '../models/User.js';
import Match from '../models/Match.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getUserMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get user profile by username along with match history
 * @route   GET /api/users/profile/:username
 * @access  Public
 */
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get match history where user is player1 or player2
    const matches = await Match.find({
      $or: [{ player1: user._id }, { player2: user._id }],
      status: 'finished'
    })
      .populate('player1', 'username profilePicture rating')
      .populate('player2', 'username profilePicture rating')
      .populate('winner', 'username')
      .populate('problem', 'title difficulty platform topic')
      .sort({ createdAt: -1 })
      .limit(10); // get last 10 games

    // Calculate win rate
    const totalMatches = user.wins + user.losses;
    const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;

    res.json({
      user,
      winRate,
      matches,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get global leaderboard sorted by ELO rating
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .select('username rating wins losses streak profilePicture')
      .sort({ rating: -1 })
      .limit(50); // Get top 50 players

    const mappedLeaderboard = leaderboard.map((player, index) => {
      const total = player.wins + player.losses;
      const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0;
      return {
        rank: index + 1,
        _id: player._id,
        username: player.username,
        rating: player.rating,
        wins: player.wins,
        losses: player.losses,
        streak: player.streak,
        profilePicture: player.profilePicture,
        winRate,
      };
    });

    res.json(mappedLeaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Generate genuine notifications for the current user
 *          derived from real match history, streak, and rating milestones.
 * @route   GET /api/users/me/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const notifications = [];

    // ── 1. Last 5 finished matches ──────────────────────────────────────────
    const recentMatches = await Match.find({
      $or: [{ player1: user._id }, { player2: user._id }],
      status: 'finished',
    })
      .populate('player1', 'username')
      .populate('player2', 'username')
      .populate('winner', 'username')
      .populate('problem', 'title difficulty')
      .sort({ updatedAt: -1 })
      .limit(5);

    for (const match of recentMatches) {
      const opponent =
        match.player1?._id?.toString() === user._id.toString()
          ? match.player2?.username
          : match.player1?.username;

      const isDraw = !match.winner;
      const didWin = match.winner?.username === user.username;
      const problemLabel = match.problem
        ? `${match.problem.title} (${match.problem.difficulty})`
        : 'a problem';

      let title, body, icon;
      if (isDraw) {
        icon = '🤝';
        title = 'Match Drawn';
        body = `Your battle against ${opponent || 'an opponent'} on "${problemLabel}" ended in a draw.`;
      } else if (didWin) {
        icon = '🏆';
        title = 'Victory';
        body = `You defeated ${opponent || 'an opponent'} on "${problemLabel}".`;
      } else {
        icon = '💀';
        title = 'Defeat';
        body = `You lost to ${opponent || 'an opponent'} on "${problemLabel}". Study and return stronger.`;
      }

      const diffMs = Date.now() - new Date(match.updatedAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const timeAgo =
        diffMins < 1 ? 'just now'
        : diffMins < 60 ? `${diffMins}m ago`
        : diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago`
        : `${Math.floor(diffMins / 1440)}d ago`;

      notifications.push({
        id: match._id.toString(),
        icon,
        title,
        body,
        time: timeAgo,
        unread: diffMins < 60, // unread if within last hour
      });
    }

    // ── 2. Active streak milestone ──────────────────────────────────────────
    if (user.streak >= 3) {
      notifications.push({
        id: `streak-${user.streak}`,
        icon: '🔥',
        title: `${user.streak}-Win Streak!`,
        body: `You are on a ${user.streak}-match winning streak. Keep the momentum going!`,
        time: 'now',
        unread: true,
      });
    }

    // ── 3. Rating tier milestones ───────────────────────────────────────────
    const milestones = [
      { threshold: 1800, label: 'Grandmaster', icon: '👑' },
      { threshold: 1500, label: 'Master', icon: '🌟' },
      { threshold: 1200, label: 'Expert', icon: '⚡' },
    ];
    for (const m of milestones) {
      if (user.rating >= m.threshold && user.rating < m.threshold + 50) {
        notifications.push({
          id: `milestone-${m.threshold}`,
          icon: m.icon,
          title: `Tier Reached: ${m.label}`,
          body: `Your ELO crossed ${m.threshold}. You have been promoted to ${m.label}!`,
          time: 'recently',
          unread: true,
        });
        break; // only show the highest relevant one
      }
    }

    // ── 4. No activity nudge ────────────────────────────────────────────────
    if (recentMatches.length === 0) {
      notifications.push({
        id: 'no-activity',
        icon: '⚔️',
        title: 'Ready to Battle?',
        body: 'You have no recent matches. Jump into the matchmaker and start climbing the leaderboard!',
        time: 'now',
        unread: true,
      });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Update current user's profile picture
 * @route   PATCH /api/users/me/avatar
 * @access  Private
 */
export const updateAvatar = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Accept base64 data URLs (e.g. "data:image/jpeg;base64,...")
    // or plain URLs. Limit base64 size to ~2MB.
    if (profilePicture.startsWith('data:')) {
      const base64Data = profilePicture.split(',')[1] || '';
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      if (sizeInBytes > 2 * 1024 * 1024) {
        return res.status(413).json({ error: 'Image too large. Maximum size is 2 MB.' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true, runValidators: false }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
