'use strict';

const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/topics');

const { Schema } = mongoose;

const topicSelectionSchema = new Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    topics: { type: [String], default: [] },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },

    selectedCategories: { type: [String], enum: CATEGORIES, default: [] },
    selectedTopics: { type: [topicSelectionSchema], default: [] },
    customKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'A maximum of 5 custom keywords is allowed.',
      },
    },

    notificationMode: { type: String, enum: ['IMPORTANT', 'BREAKING_ONLY'], default: 'IMPORTANT' },
    digestPreference: { type: String, enum: ['MORNING', 'EVENING', 'BOTH', 'NONE'], default: 'NONE' },

    onboardingCompleted: { type: Boolean, default: false },
    lastDigestSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
