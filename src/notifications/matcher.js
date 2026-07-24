'use strict';

const User = require('../models/User');

/**
 * Finds users interested in a given story based on their selected
 * categories, topics, custom keywords, and notification mode.
 * @param {object} story
 * @returns {Promise<object[]>}
 */
async function findInterestedUsers(story) {
  const users = await User.find({
    onboardingCompleted: true,
    selectedCategories: story.category,
  });

  return users.filter((user) => {
    if (user.notificationMode === 'BREAKING_ONLY' && !story.isBreaking) {
      return false;
    }

    const userTopicsForCategory = user.selectedTopics.find((t) => t.category === story.category)?.topics || [];
    // No specific topics chosen for this category means "interested in
    // everything in it" — a sensible default rather than notifying no one.
    const hasTopicOverlap =
      userTopicsForCategory.length === 0 || userTopicsForCategory.some((t) => story.topics.includes(t));

    const headlineLower = story.headline.toLowerCase();
    const hasKeywordMatch = user.customKeywords.some((kw) => headlineLower.includes(kw.toLowerCase()));

    return hasTopicOverlap || hasKeywordMatch;
  });
}

module.exports = { findInterestedUsers };
