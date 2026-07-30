import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates draw or incomplete
    },
    status: {
      type: String,
      required: true,
      enum: ['waiting', 'countdown', 'playing', 'finished'],
      default: 'waiting',
    },
    settings: {
      platform: { type: String, required: true },
      difficulty: { type: String, required: true },
      topic: { type: String, required: true },
      timeLimit: { type: Number, required: true }, // in minutes
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
