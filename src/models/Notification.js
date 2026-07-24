'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
    notificationType: { type: String, enum: ['NEW_STORY', 'LIVE_STORY', 'DIGEST'], required: true },
    updateNumber: { type: Number, default: 0 },
    sentTime: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Hard guarantee at the database level: a user can never be notified
// twice for the same story at the same update number.
notificationSchema.index({ userId: 1, storyId: 1, updateNumber: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
