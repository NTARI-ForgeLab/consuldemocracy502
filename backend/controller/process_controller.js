// controllers/process.controller.js

const Process = require('../models/Process');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all active processes
exports.getActiveProcesses = async (req, res) => {
  try {
    const processes = await Process.find({ status: 'active' })
      .sort({ 'phases.startDate': 1 })
      .select('title description phases scope status')
      .populate('createdBy', 'username profile.name');
      
    res.json(processes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single process with all details
exports.getProcessById = async (req, res) => {
  try {
    const process = await Process.findById(req.params.id)
      .populate('createdBy', 'username profile.name');
      
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    
    // Check if user has access based on process.accessLevel
    const { user } = req;
    if (process.accessLevel !== 'open') {
      // This checks if the user meets the verification requirements
      if (!user || !checkAccessPermission(user, process.accessLevel)) {
        return res.status(403).json({ 
          message: 'You need additional verification to access this process' 
        });
      }
    }
    
    res.json(process);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new process (admin only)
exports.createProcess = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if user has admin permission
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to create processes' });
    }
    
    const newProcess = new Process({
      ...req.body,
      createdBy: req.user.id
    });
    
    const process = await newProcess.save();
    res.status(201).json(process);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a process (admin only)
exports.updateProcess = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if user has admin permission
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to update processes' });
    }
    
    const process = await Process.findById(req.params.id);
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    
    // Update with audit trail
    const updatedProcess = await Process.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.json(updatedProcess);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current active phase for a process
exports.getCurrentPhase = async (req, res) => {
  try {
    const process = await Process.findById(req.params.id);
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    
    const now = new Date();
    const currentPhase = process.phases.find(phase => 
      phase.startDate <= now && phase.endDate >= now
    );
    
    if (!currentPhase) {
      return res.status(404).json({ message: 'No active phase found' });
    }
    
    res.json(currentPhase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to check if user meets verification requirements
const checkAccessPermission = (user, accessLevel) => {
  const verificationLevel = user.getVerificationLevel();
  
  switch(accessLevel) {
    case 'open':
      return true;
    case 'verified':
      return verificationLevel >= 1;
    case 'resident':
      return verificationLevel >= 3;
    case 'invited':
      // Additional logic for invitation verification would go here
      return false;
    default:
      return false;
  }
};

module.exports = exports;
