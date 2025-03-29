// models/Deliberation.js - Deliberation system inspired by Polis

const mongoose = require('mongoose');

const DeliberationSchema = new mongoose.Schema({
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
  
  // Deliberation parameters
  parameters: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    mode: {
      type: String,
      enum: ['statement_based', 'threaded', 'argument_mapping'],
      default: 'statement_based'
    },
    allowAnonymous: {
      type: Boolean,
      default: false
    }
  },
  
  // Initial statements to seed discussion
  seedStatements: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // For statement-based mode (like Polis)
  statements: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Track agreement/disagreement
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      position: {
        type: String,
        enum: ['agree', 'disagree', 'neutral', 'pass'],
        required: true
      },
      reactedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Moderation
    moderation: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      moderatedAt: Date
    }
  }],
  
  // For threaded mode
  comments: [{
    content: {
      type: String
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId
    }, // Self-reference for threading
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Comment voting
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      value: {
        type: Number,
        enum: [-1, 0, 1],
        default: 0
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Moderation
    moderation: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      moderatedAt: Date
    }
  }],
  
  // For argument mapping mode
  arguments: [{
    content: String,
    type: {
      type: String,
      enum: ['claim', 'premise', 'objection', 'rebuttal', 'question', 'evidence'],
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    connections: [{
      target: {
        type: mongoose.Schema.Types.ObjectId
      },
      relationship: {
        type: String,
        enum: ['supports', 'opposes', 'answers', 'elaborates'],
        required: true
      }
    }]
  }],
  
  // Analysis (for Polis-style opinion mapping)
  analysis: {
    lastCalculated: Date,
    clusters: [{
      id: Number,
      size: Number,
      centerStatements: [Number],
      memberCount: Number
    }],
    consensusStatements: [{
      statementIndex: Number,
      agreement: Number // Percentage of agreement across clusters
    }],
    divisiveStatements: [{
      statementIndex: Number,
      polarization: Number // Measure of how much this divides clusters
    }]
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

module.exports = mongoose.model('Deliberation', DeliberationSchema);
