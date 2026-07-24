'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const articleSchema = new Schema(
  {
    originalTitle: { type: String, required: true },
    source: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    fullArticle: { type: String, default: '' },
    publishedDate: { type: Date, default: Date.now },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', default: null, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Article', articleSchema);
