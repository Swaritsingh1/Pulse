'use strict';

const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/topics');

const { Schema } = mongoose;

const liveUpdateSchema = new Schema(
  {
    updateNumber: { type: Number, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const storySchema = new Schema(
  {
    headline: { type: String, required: true },
    canonicalHeadline: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    whyItMatters: { type: String, required: true },

    category: { type: String, enum: CATEGORIES, required: true, index: true },
    topics: { type: [String], default: [] },

    sources: { type: [String], default: [] },
    articleUrls: { type: [String], default: [] },

    // Excluded from normal queries to keep payloads small; the dedup
    // engine explicitly .select('+embedding') when it needs this.
    embedding: { type: [Number], default: [], select: false },

    publishedTime: { type: Date, required: true, index: true },
    lastUpdated: { type: Date, default: Date.now },

    storyStatus: { type: String, enum: ['NEW_STORY', 'LIVE_STORY'], default: 'NEW_STORY' },
    updateCount: { type: Number, default: 0 },
    liveUpdates: { type: [liveUpdateSchema], default: [] },

    storyHash: { type: String, index: true },
    isBreaking: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Powers the dedup window query: "recent stories in this category".
storySchema.index({ category: 1, publishedTime: -1 });

module.exports = mongoose.model('Story', storySchema);
