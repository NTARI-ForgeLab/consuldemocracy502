// models/Proposal.js - Proposal system with support tracking and workflow

const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  process: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Process',
    required: true
  },
  category: {
    type: String
  },
  tags: [String],
  
  // Track support from other users
  supporters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    supportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Proposal workflow stages
  status: {
    type: String,
    enum: ['draft', 'published', 'reviewing', 'accepted', 'rejected', 'implementation', 'completed'],
    default: 'draft'
  },
  
  // Moderation data
  moderation: {
    approved: { type: Boolean, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    reports: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Official response - critical for closing feedback loop
  officialResponse: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Implementation tracking - vital for trust
  implementation: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
      default: 'not_started'
    },
    startDate: Date,
    completionDate: Date,
    updates: [{
      content: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Geographic information when relevant
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Support counting virtual
ProposalSchema.virtual('supportCount').get(function() {
  return this.supporters.length;
});

// Indexes for efficient querying
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ 'supporters.user': 1 });
ProposalSchema.index({ process: 1 });
ProposalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Proposal', ProposalSchema);
