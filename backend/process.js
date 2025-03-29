// models/Process.js - The central organizing entity, inspired by Decidim's process architecture

const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Multiple phases allow for configurable process sequences
  phases: [{
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    activeComponents: [{
      componentType: {
        type: String,
        enum: ['proposals', 'voting', 'deliberation', 'budgeting', 'surveys'],
        required: true
      },
      settings: mongoose.Schema.Types.Mixed // Flexible settings for each component
    }]
  }],
  // Scoping allows processes to be limited to specific geographic areas
  scope: {
    type: String,
    enum: ['citywide', 'district', 'neighborhood', 'specific'],
    default: 'citywide'
  },
  scopeDetails: mongoose.Schema.Types.Mixed, // Additional scope data (e.g., district IDs)
  
  // Participation thresholds, if any
  thresholds: {
    proposals: {
      support: { type: Number, default: 0 } // Number of supports needed to advance
    },
    voting: {
      turnout: { type: Number, default: 0 } // Minimum turnout for valid vote
    }
  },
  
  // Access control - what verification level is required
  accessLevel: {
    type: String,
    enum: ['open', 'verified', 'resident', 'invited'],
    default: 'verified'
  },
  
  // Moderation settings
  moderation: {
    preModeration: { type: Boolean, default: false }, // Require approval before publishing
    reportThreshold: { type: Number, default: 5 } // Reports needed for review
  },
  
  // Process status
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
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

// Indexes for efficient querying
ProcessSchema.index({ status: 1 });
ProcessSchema.index({ 'phases.startDate': 1, 'phases.endDate': 1 });

module.exports = mongoose.model('Process', ProcessSchema);
