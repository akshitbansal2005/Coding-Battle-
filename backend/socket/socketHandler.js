import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { executeCode } from '../services/executor.js';

let matchmakingQueue = []; // Array of { socketId, userId, username, rating, settings }
const activeRooms = new Map(); // roomCode -> RoomState in-memory

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Helper to select a problem based on settings
const selectProblem = async (settings) => {
  const query = {};
  if (settings.platform && settings.platform !== 'All') {
    query.platform = settings.platform;
  }
  if (settings.difficulty && settings.difficulty !== 'All') {
    query.difficulty = settings.difficulty;
  }
  if (settings.topic && settings.topic !== 'All') {
    query.topic = settings.topic;
  }

  let problems = await Problem.find(query);
  if (problems.length === 0) {
    // Relax topic filter first
    delete query.topic;
    problems = await Problem.find(query);
  }
  if (problems.length === 0) {
    // Relax difficulty
    delete query.difficulty;
    problems = await Problem.find(query);
  }
  if (problems.length === 0) {
    // Get any problem
    problems = await Problem.find({});
  }

  if (problems.length === 0) return null;
  return problems[Math.floor(Math.random() * problems.length)];
};

// Calculate simple ELO ratings
const updatePlayerRatings = async (winnerId, loserId) => {
  if (winnerId === 'bot_ai_opponent') {
    const loser = await User.findById(loserId);
    if (loser) {
      loser.losses += 1;
      loser.streak = 0;
      await loser.save();
    }
    return { winnerChange: 15, loserChange: -12 };
  }

  if (loserId === 'bot_ai_opponent') {
    const winner = await User.findById(winnerId);
    if (winner) {
      winner.rating += 24;
      winner.wins += 1;
      winner.streak += 1;
      await winner.save();
    }
    return { winnerChange: 24, loserChange: -10 };
  }

  const winner = await User.findById(winnerId);
  const loser = await User.findById(loserId);

  if (!winner || !loser) return { winnerChange: 0, loserChange: 0 };


  // Simple ELO formula
  const Kw = 32;
  const Kl = 32;
  const Ew = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
  const El = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));

  const winnerChange = Math.round(Kw * (1 - Ew));
  const loserChange = Math.round(Kl * (0 - El));

  winner.rating += winnerChange;
  winner.wins += 1;
  winner.streak += 1;

  loser.rating = Math.max(100, loser.rating + loserChange);
  loser.losses += 1;
  loser.streak = 0;

  await winner.save();
  await loser.save();

  return {
    winnerChange,
    loserChange,
    newWinnerRating: winner.rating,
    newLoserRating: loser.rating
  };
};

export const handleSocketEvents = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user.username}`);

    // --- 1. RANDOM MATCHMAKING ---
    socket.on('join-matchmaking', async ({ platform, difficulty, topic, timeLimit }) => {
      // Remove user if they are already in the queue
      matchmakingQueue = matchmakingQueue.filter(p => p.userId !== socket.user._id.toString());

      const settings = { platform, difficulty, topic, timeLimit };
      console.log(`User ${socket.user.username} entered queue with ELO ${socket.user.rating}`);

      // Try to find a match with similar ELO (+-200) and overlapping settings
      const matchIndex = matchmakingQueue.findIndex(opponent => {
        const ratingDiff = Math.abs(opponent.rating - socket.user.rating);
        if (ratingDiff > 250) return false;

        const platMatch = settings.platform === 'All' || opponent.settings.platform === 'All' || settings.platform === opponent.settings.platform;
        const diffMatch = settings.difficulty === 'All' || opponent.settings.difficulty === 'All' || settings.difficulty === opponent.settings.difficulty;
        const topicMatch = settings.topic === 'All' || opponent.settings.topic === 'All' || settings.topic === opponent.settings.topic;

        return platMatch && diffMatch && topicMatch;
      });

      if (matchIndex !== -1) {
        // Found a match!
        const opponent = matchmakingQueue[matchIndex];
        matchmakingQueue.splice(matchIndex, 1); // Remove opponent from queue

        const roomCode = generateRoomCode();
        const opponentSocket = io.sockets.sockets.get(opponent.socketId);

        if (!opponentSocket) {
          // Opponent socket closed, re-push current player to queue
          matchmakingQueue.push({
            socketId: socket.id,
            userId: socket.user._id.toString(),
            username: socket.user.username,
            rating: socket.user.rating,
            settings
          });
          socket.emit('queue-status', { status: 'waiting' });
          return;
        }

        // Common settings
        const finalSettings = {
          platform: settings.platform !== 'All' ? settings.platform : (opponent.settings.platform !== 'All' ? opponent.settings.platform : 'LeetCode'),
          difficulty: settings.difficulty !== 'All' ? settings.difficulty : (opponent.settings.difficulty !== 'All' ? opponent.settings.difficulty : 'Medium'),
          topic: settings.topic !== 'All' ? settings.topic : (opponent.settings.topic !== 'All' ? opponent.settings.topic : 'Arrays'),
          timeLimit: Math.min(settings.timeLimit, opponent.settings.timeLimit) || 30
        };

        const problem = await selectProblem(finalSettings);
        if (!problem) {
          socket.emit('error-msg', 'No problem found matching requirements.');
          opponentSocket.emit('error-msg', 'No problem found matching requirements.');
          return;
        }

        // Create Match in MongoDB
        const match = await Match.create({
          roomCode,
          player1: socket.user._id,
          player2: opponent.userId,
          status: 'waiting',
          settings: finalSettings,
          problem: problem._id
        });

        // Initialize room state
        const roomState = {
          matchId: match._id,
          roomCode,
          problem,
          players: {
            [socket.user._id.toString()]: {
              userId: socket.user._id.toString(),
              username: socket.user.username,
              rating: socket.user.rating,
              profilePicture: socket.user.profilePicture,
              socketId: socket.id,
              ready: false,
              progress: 0,
              charCount: 0,
              lineCount: 1,
              language: 'javascript'
            },
            [opponent.userId]: {
              userId: opponent.userId,
              username: opponent.username,
              rating: opponent.rating,
              profilePicture: opponent.profilePicture,
              socketId: opponent.socketId,
              ready: false,
              progress: 0,
              charCount: 0,
              lineCount: 1,
              language: 'javascript'
            }
          },
          status: 'waiting',
          startTime: null
        };

        activeRooms.set(roomCode, roomState);

        // Join both sockets
        socket.join(roomCode);
        opponentSocket.join(roomCode);

        io.to(roomCode).emit('match-found', {
          roomCode,
          problem,
          players: roomState.players,
          settings: finalSettings
        });
      } else {
        // Add to queue
        matchmakingQueue.push({
          socketId: socket.id,
          userId: socket.user._id.toString(),
          username: socket.user.username,
          rating: socket.user.rating,
          settings
        });
        socket.emit('queue-status', { status: 'waiting' });
      }
    });

    // --- 1B. VS AI BOT MATCHMAKING ---
    const startBotSimulation = (roomCode, room) => {
      const botId = 'bot_ai_opponent';
      let progress = 0;
      let charCount = 0;
      let lineCount = 1;

      // Simulated Bot typing interval
      const botInterval = setInterval(() => {
        const activeRoom = activeRooms.get(roomCode);
        if (!activeRoom || activeRoom.status !== 'playing') {
          clearInterval(botInterval);
          return;
        }

        // Increment progress randomly
        const increment = Math.floor(Math.random() * 12) + 5;
        progress = Math.min(100, progress + increment);
        charCount += Math.floor(Math.random() * 35) + 15;
        lineCount += Math.floor(Math.random() * 3) + 1;

        const botPlayer = activeRoom.players[botId];
        if (botPlayer) {
          botPlayer.progress = progress;
          botPlayer.charCount = charCount;
          botPlayer.lineCount = lineCount;
        }

        // Broadcast bot telemetry to room
        io.to(roomCode).emit('opponent-code-sync', {
          userId: botId,
          progress,
          charCount,
          lineCount,
          language: 'cpp'
        });

        // Intermediate submission simulation around 50%
        if (progress > 45 && progress < 60 && !botPlayer.hasSubmittedWrong) {
          botPlayer.hasSubmittedWrong = true;
          io.to(roomCode).emit('opponent-submission', {
            username: botPlayer.username,
            verdict: 'Wrong Answer'
          });
        }

        // Bot finishes solution!
        if (progress >= 100) {
          clearInterval(botInterval);
          if (activeRoom.timeoutId) clearTimeout(activeRoom.timeoutId);
          activeRoom.status = 'finished';

          const duration = Math.round((Date.now() - activeRoom.startTime) / 1000);

          Match.findById(activeRoom.matchId).then(async (match) => {
            if (match) {
              match.status = 'finished';
              match.duration = duration;
              await match.save();
            }

            io.to(roomCode).emit('match-ended', {
              winnerId: botId,
              winnerName: botPlayer.username,
              duration,
              eloChanges: { winnerChange: 15, loserChange: -12 },
              stats: activeRoom.players
            });

            activeRooms.delete(roomCode);
          }).catch(console.error);
        }
      }, 3500);

      room.botInterval = botInterval;
    };

    socket.on('start-bot-match', async ({ platform, difficulty, topic, timeLimit }) => {
      const roomCode = generateRoomCode();
      const settings = {
        platform: platform !== 'All' ? platform : 'LeetCode',
        difficulty: difficulty !== 'All' ? difficulty : 'Medium',
        topic: topic !== 'All' ? topic : 'Arrays',
        timeLimit: timeLimit || 15
      };

      const problem = await selectProblem(settings);
      if (!problem) {
        socket.emit('error-msg', 'No problem found matching requirements.');
        return;
      }

      const botId = 'bot_ai_opponent';
      const botPlayer = {
        userId: botId,
        username: 'AlphaCode_AI [BOT]',
        rating: 1540,
        profilePicture: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        socketId: 'bot_socket',
        ready: true,
        progress: 0,
        charCount: 0,
        lineCount: 1,
        language: 'cpp',
        isBot: true
      };

      const userPlayer = {
        userId: socket.user._id.toString(),
        username: socket.user.username,
        rating: socket.user.rating || 1200,
        profilePicture: socket.user.profilePicture,
        socketId: socket.id,
        ready: true,
        progress: 0,
        charCount: 0,
        lineCount: 1,
        language: 'javascript'
      };

      // Create Match in MongoDB
      const match = await Match.create({
        roomCode,
        player1: socket.user._id,
        status: 'waiting',
        settings,
        problem: problem._id
      });

      const roomState = {
        matchId: match._id,
        roomCode,
        problem,
        players: {
          [socket.user._id.toString()]: userPlayer,
          [botId]: botPlayer
        },
        status: 'waiting',
        settings,
        startTime: null
      };

      activeRooms.set(roomCode, roomState);
      socket.join(roomCode);

      socket.emit('private-room-created', { roomCode });
    });

    socket.on('add-bot-opponent', async ({ roomCode }) => {
      const upperCode = roomCode.toUpperCase();
      const room = activeRooms.get(upperCode);
      if (!room) return;

      const botId = 'bot_ai_opponent';
      if (room.players[botId]) return; // Bot already added

      room.players[botId] = {
        userId: botId,
        username: 'AlphaCode_AI [BOT]',
        rating: 1540,
        profilePicture: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        socketId: 'bot_socket',
        ready: true,
        progress: 0,
        charCount: 0,
        lineCount: 1,
        language: 'cpp',
        isBot: true
      };

      io.to(upperCode).emit('player-joined', {
        roomCode: upperCode,
        players: room.players,
        settings: room.settings
      });
    });

    socket.on('leave-matchmaking', () => {
      matchmakingQueue = matchmakingQueue.filter(p => p.userId !== socket.user._id.toString());
      socket.emit('queue-status', { status: 'idle' });
    });


    // --- 2. PRIVATE ROOM CREATION/JOINING ---
    socket.on('create-private-room', async ({ platform, difficulty, topic, timeLimit }) => {
      const roomCode = generateRoomCode();
      const settings = { platform, difficulty, topic, timeLimit };

      const match = await Match.create({
        roomCode,
        player1: socket.user._id,
        status: 'waiting',
        settings
      });

      const roomState = {
        matchId: match._id,
        roomCode,
        problem: null, // picked when match starts
        players: {
          [socket.user._id.toString()]: {
            userId: socket.user._id.toString(),
            username: socket.user.username,
            rating: socket.user.rating,
            profilePicture: socket.user.profilePicture,
            socketId: socket.id,
            ready: false,
            progress: 0,
            charCount: 0,
            lineCount: 1,
            language: 'javascript'
          }
        },
        status: 'waiting',
        settings,
        startTime: null
      };

      activeRooms.set(roomCode, roomState);
      socket.join(roomCode);

      socket.emit('private-room-created', {
        roomCode,
        players: roomState.players,
        settings
      });
    });

    socket.on('join-private-room', async ({ roomCode }) => {
      const upperCode = roomCode.toUpperCase();
      let room = activeRooms.get(upperCode);

      // Re-hydrate room from MongoDB if it's missing from memory
      if (!room) {
        const dbMatch = await Match.findOne({ roomCode: upperCode, status: 'waiting' })
          .populate('player1', 'username rating profilePicture')
          .populate('player2', 'username rating profilePicture')
          .populate('problem');

        if (dbMatch) {
          const playersObj = {};
          if (dbMatch.player1) {
            playersObj[dbMatch.player1._id.toString()] = {
              userId: dbMatch.player1._id.toString(),
              username: dbMatch.player1.username,
              rating: dbMatch.player1.rating || 1200,
              profilePicture: dbMatch.player1.profilePicture,
              socketId: null,
              ready: false,
              progress: 0,
              charCount: 0,
              lineCount: 1,
              language: 'javascript'
            };
          }
          if (dbMatch.player2) {
            playersObj[dbMatch.player2._id.toString()] = {
              userId: dbMatch.player2._id.toString(),
              username: dbMatch.player2.username,
              rating: dbMatch.player2.rating || 1200,
              profilePicture: dbMatch.player2.profilePicture,
              socketId: null,
              ready: false,
              progress: 0,
              charCount: 0,
              lineCount: 1,
              language: 'javascript'
            };
          }

          room = {
            matchId: dbMatch._id,
            roomCode: upperCode,
            problem: dbMatch.problem || null,
            players: playersObj,
            status: 'waiting',
            settings: dbMatch.settings || {},
            startTime: null
          };

          activeRooms.set(upperCode, room);
        }
      }

      if (!room) {
        socket.emit('room-error', 'Room not found.');
        return;
      }

      const userIdStr = socket.user._id.toString();

      // Check if lobby is full for non-members
      if (Object.keys(room.players).length >= 2 && !room.players[userIdStr]) {
        socket.emit('room-error', 'Lobby is full.');
        return;
      }

      // ── Creator or returning player reconnecting ───────────────────────────
      if (room.players[userIdStr]) {
        room.players[userIdStr].socketId = socket.id;
        socket.join(upperCode);

        // Notify room members
        io.to(upperCode).emit('player-joined', {
          roomCode: upperCode,
          players: room.players,
          settings: room.settings
        });
        return;
      }

      // ── New guest joining ───────────────────────────────────────────────────
      room.players[userIdStr] = {
        userId: userIdStr,
        username: socket.user.username,
        rating: socket.user.rating || 1200,
        profilePicture: socket.user.profilePicture,
        socketId: socket.id,
        ready: false,
        progress: 0,
        charCount: 0,
        lineCount: 1,
        language: 'javascript'
      };

      // Update match document with player2
      const match = await Match.findById(room.matchId);
      if (match) {
        match.player2 = socket.user._id;
        await match.save();
      }

      socket.join(upperCode);
      io.to(upperCode).emit('player-joined', {
        roomCode: upperCode,
        players: room.players,
        settings: room.settings
      });
    });


    // --- 3. LOBBY FLOW (READY CHECKS & COUNTDOWN) ---
    socket.on('player-ready', async ({ roomCode, ready }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      const player = room.players[socket.user._id.toString()];
      if (player) {
        player.ready = ready;
        io.to(roomCode).emit('ready-status-updated', { players: room.players });

        // Check if both players are ready
        const playerIds = Object.keys(room.players);
        if (playerIds.length === 2 && room.players[playerIds[0]].ready && room.players[playerIds[1]].ready) {
          room.status = 'countdown';
          io.to(roomCode).emit('countdown-start', { delay: 5 });

          // Fetch problem if not chosen yet (for private rooms)
          if (!room.problem) {
            const problem = await selectProblem(room.settings);
            if (!problem) {
              io.to(roomCode).emit('error-msg', 'Failed to retrieve code challenge.');
              return;
            }
            room.problem = problem;
            const match = await Match.findById(room.matchId);
            if (match) {
              match.problem = problem._id;
              await match.save();
            }
          }

          setTimeout(async () => {
            // Start the actual game timer
            const match = await Match.findById(room.matchId);
            if (match) {
              match.status = 'playing';
              await match.save();
            }

            room.status = 'playing';
            room.startTime = Date.now();

            io.to(roomCode).emit('battle-start', {
              problem: room.problem,
              startTime: room.startTime,
              timeLimit: room.settings.timeLimit
            });

            // Start bot typing simulation if bot is in the match
            if (room.players['bot_ai_opponent']) {
              startBotSimulation(roomCode, room);
            }

            // Start backend-enforced match expiration timer
            const limitMs = (room.settings.timeLimit || 30) * 60 * 1000;
            room.timeoutId = setTimeout(async () => {
              const activeRoom = activeRooms.get(roomCode);
              if (activeRoom && activeRoom.status === 'playing') {
                activeRoom.status = 'finished';
                const duration = Math.round((Date.now() - activeRoom.startTime) / 1000);

                // Update Match in DB to ended with no winner (draw)
                const dbMatch = await Match.findById(activeRoom.matchId);
                if (dbMatch) {
                  dbMatch.status = 'finished';
                  dbMatch.winner = null;
                  dbMatch.duration = duration;
                  await dbMatch.save();
                }

                io.to(roomCode).emit('match-ended', {
                  winnerId: null,
                  winnerName: null,
                  draw: true,
                  duration,
                  eloChanges: { winnerChange: 0, loserChange: 0 },
                  stats: activeRoom.players
                });

                activeRooms.delete(roomCode);
              }
            }, limitMs);
          }, 5000);
        }
      }
    });

    // --- 4. REAL-TIME CODE SYNCING ---
    socket.on('code-sync', ({ roomCode, progress, charCount, lineCount, language }) => {
      const room = activeRooms.get(roomCode);
      if (!room || room.status !== 'playing') return;

      const player = room.players[socket.user._id.toString()];
      if (player) {
        player.progress = progress;
        player.charCount = charCount;
        player.lineCount = lineCount;
        player.language = language;

        socket.to(roomCode).emit('opponent-code-sync', {
          userId: socket.user._id.toString(),
          progress,
          charCount,
          lineCount,
          language
        });
      }
    });

    // --- 5. SOLUTION SUBMISSIONS ---
    socket.on('submit-solution', async ({ roomCode, code, language }) => {
      const room = activeRooms.get(roomCode);
      if (!room || room.status !== 'playing') {
        socket.emit('submission-verdict', { error: 'Match is not active.' });
        return;
      }

      console.log(`Verdict check for ${socket.user.username} in Room ${roomCode}`);

      try {
        const problem = room.problem;
        const testCases = problem.testCases;

        // Execute user code on all test cases
        const result = await executeCode(code, language, testCases);

        // Record submission
        const verdict = result.success ? 'Accepted' : (result.results.find(r => r.status === 'Time Limit Exceeded') ? 'Time Limit Exceeded' : (result.results.find(r => r.status === 'Error') ? 'Compilation Error' : 'Wrong Answer'));
        
        await Submission.create({
          match: room.matchId,
          user: socket.user._id,
          code,
          language,
          verdict,
          passedCases: result.passedCount,
          totalCases: result.totalCount
        });

        socket.emit('submission-verdict', {
          verdict,
          passedCount: result.passedCount,
          totalCount: result.totalCount,
          results: result.results
        });

        // Notify opponent that a submission was received and verdict updated
        socket.to(roomCode).emit('opponent-submission', {
          username: socket.user.username,
          verdict
        });

        if (result.success) {
          if (room.timeoutId) clearTimeout(room.timeoutId);
          // WE HAVE A WINNER!
          room.status = 'finished';
          const duration = Math.round((Date.now() - room.startTime) / 1000);

          // Find loser ID
          const opponentId = Object.keys(room.players).find(id => id !== socket.user._id.toString());
          
          let eloChanges = { winnerChange: 0, loserChange: 0 };
          if (opponentId) {
            eloChanges = await updatePlayerRatings(socket.user._id, opponentId);
          }

          // Update Match in DB
          const match = await Match.findById(room.matchId);
          if (match) {
            match.winner = socket.user._id;
            match.status = 'finished';
            match.duration = duration;
            await match.save();
          }

          io.to(roomCode).emit('match-ended', {
            winnerId: socket.user._id.toString(),
            winnerName: socket.user.username,
            duration,
            eloChanges,
            stats: room.players
          });

          activeRooms.delete(roomCode);
        }
      } catch (err) {
        console.error(err);
        socket.emit('submission-verdict', { error: 'Sandbox execution error: ' + err.message });
      }
    });

    // --- 6. FORFEIT / QUIT ROOM ---
    socket.on('forfeit-match', async ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room || room.status !== 'playing') return;

      if (room.timeoutId) clearTimeout(room.timeoutId);
      room.status = 'finished';
      const duration = Math.round((Date.now() - room.startTime) / 1000);

      const opponentId = Object.keys(room.players).find(id => id !== socket.user._id.toString());
      
      let eloChanges = { winnerChange: 0, loserChange: 0 };
      if (opponentId) {
        eloChanges = await updatePlayerRatings(opponentId, socket.user._id);
        
        const match = await Match.findById(room.matchId);
        if (match) {
          if (opponentId && opponentId !== 'bot_ai_opponent') {
            match.winner = opponentId;
          }
          match.status = 'finished';
          match.duration = duration;
          await match.save();
        }

        io.to(roomCode).emit('match-ended', {
          winnerId: opponentId,
          winnerName: room.players[opponentId].username,
          duration,
          forfeit: true,
          eloChanges,
          stats: room.players
        });
      }

      activeRooms.delete(roomCode);
    });

    // --- 7. DISCONNECT & FORFEIT HANDLING ---
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      matchmakingQueue = matchmakingQueue.filter(p => p.userId !== socket.user._id.toString());

      // Search if player was in an active game room
      for (const [roomCode, room] of activeRooms.entries()) {
        if (room.players[socket.user._id.toString()]) {
          // If match was in lobby waiting state
          if (room.status === 'waiting' || room.status === 'countdown') {
            const player = room.players[socket.user._id.toString()];
            if (player && player.socketId === socket.id) {
              player.socketId = null; // Unbind socket, keep player in lobby state for reconnect
            }
          } 
          // If match was in active playing state, they forfeit by disconnecting!
          else if (room.status === 'playing') {
            if (room.timeoutId) clearTimeout(room.timeoutId);
            room.status = 'finished';
            const duration = Math.round((Date.now() - room.startTime) / 1000);
            const opponentId = Object.keys(room.players).find(id => id !== socket.user._id.toString());

            if (opponentId) {
              const eloChanges = await updatePlayerRatings(opponentId, socket.user._id);

              const match = await Match.findById(room.matchId);
              if (match) {
                if (opponentId && opponentId !== 'bot_ai_opponent') {
                  match.winner = opponentId;
                }
                match.status = 'finished';
                match.duration = duration;
                await match.save();
              }


              io.to(roomCode).emit('match-ended', {
                winnerId: opponentId,
                winnerName: room.players[opponentId].username,
                duration,
                forfeit: true,
                eloChanges,
                stats: room.players
              });
            }
            activeRooms.delete(roomCode);
          }
          break;
        }
      }
    });
  });
};
