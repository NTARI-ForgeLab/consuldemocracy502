// models/User.js - User model with multi-level verification

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    name: String,
    bio: String,
    avatar: String,
    preferredLanguage: { type: String, default: 'en' }
  },
  
  // Multi-level verification, allowing gradual trust building
  verification: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    residency: { type: Boolean, default: false },
    government: { type: Boolean, default: false },
    verificationDetails: mongoose.Schema.Types.Mixed // Store verification proofs securely
  },
  
  // Delegation (for liquid democracy features)
  delegations: [{
    scope: String, // What area this delegation applies to
    delegateTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    active: { type: Boolean, default: true }
  }],
  
  // Role-based permissions
  roles: {
    type: [String],
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: ['user']
  },
  
  // Activity data
  activity: {
    lastLogin: Date,
    participationCount: { type: Number, default: 0 },
    proposalsCreated: { type: Number, default: 0 },
    votesParticipated: { type: Number, default: 0 }
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

// Password hash middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to validate password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get verification level - important for access control
UserSchema.methods.getVerificationLevel = function() {
  if (this.verification.government) return 4;
  if (this.verification.residency) return 3;
  if (this.verification.phone) return 2;
  if (this.verification.email) return 1;
  return 0;
};

module.exports = mongoose.model('User', UserSchema);
