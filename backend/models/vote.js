// models/Vote.js - Flexible voting system with multiple methods

const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  process: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Process',
    required: true
  },
  
  // Define voting method - supports multiple democratic methods
  method: {
    type: String,
    enum: ['simple_majority', 'ranked_choice', 'approval', 'quadratic', 'knapsack'],
    required: true
  },
  
  // Options for voting - could be proposals, budgets, candidates, etc.
  options: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['proposal', 'budget_item', 'candidate', 'text_option'],
      required: true
    },
    title: String,
    description: String,
    cost: Number, // For budget voting
    category: String
  }],
  
  // Vote parameters
  parameters: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    minOptions: { 
      type: Number, 
      default: 1 
    },
    maxOptions: Number,
    totalBudget: Number, // For participatory budgeting
    quorum: Number, // Minimum participation threshold
    majorityThreshold: { 
      type: Number, 
      default: 50 
    } // Percentage needed to win
  },
  
  // Access control
  eligibility: {
    verificationLevel: {
      type: Number,
      default: 1 // 0=none, 1=email, 2=phone, 3=residency, 4=government ID
    },
    allowedGroups: [String]
  },
  
  // Individual votes - stored with one-way encryption for verification
  ballots: [{
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // For simple_majority and approval voting
    selectedOptions: [{
      type: mongoose.Schema.Types.ObjectId
    }],
    // For ranked_choice voting
    rankedOptions: [{
      option: {
        type: mongoose.Schema.Types.ObjectId
      },
      rank: Number
    }],
    // For quadratic voting
    weightedOptions: [{
      option: {
        type: mongoose.Schema.Types.ObjectId
      },
      weight: Number
    }],
    // Verification receipt - allows voters to verify their vote was counted
    receiptHash: String,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Results - calculated once voting ends
  results: {
    status: {
      type: String,
      enum: ['pending', 'counting', 'completed', 'cancelled'],
      default: 'pending'
    },
    participation: {
      total: Number,
      percentage: Number
    },
    winningOptions: [{
      option: {
        type: mongoose.Schema.Types.ObjectId
      },
      votes: Number,
      percentage: Number
    }],
    // Full results data for verification
    tally: mongoose.Schema.Types.Mixed,
    // Audit data for verification
    verificationData: {
      countMethod: String,
      countedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      countedAt: Date,
      auditHash: String // Hash of all ballots for verification
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vote', VoteSchema);
