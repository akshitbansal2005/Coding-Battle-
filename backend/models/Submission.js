import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'python', 'cpp', 'java', 'c'],
    },

    verdict: {
      type: String,
      required: true,
      enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'],
      default: 'Pending',
    },
    passedCases: {
      type: Number,
      default: 0,
    },
    totalCases: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
