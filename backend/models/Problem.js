import mongoose from 'mongoose';

const sampleCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true }
});

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['LeetCode', 'Codeforces'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    description: {
      type: String,
      required: true,
    },
    inputFormat: {
      type: String,
      required: true,
    },
    outputFormat: {
      type: String,
      required: true,
    },
    constraints: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      enum: ['Arrays', 'Strings', 'DP', 'Graph', 'Trees', 'Binary Search', 'Greedy', 'Number Theory'],
    },
    sampleCases: [sampleCaseSchema],
    testCases: [testCaseSchema],
    starterJavascript: {
      type: String,
      required: true,
    },
    starterPython: {
      type: String,
      required: true,
    },
    hints: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
