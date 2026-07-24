'use strict';

/**
 * Cosine similarity between two equal-length vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Finds the best-matching story (if any) for a new article's embedding
 * among a list of candidate stories.
 * @param {number[]} embedding
 * @param {Array<{ _id: any, embedding: number[] }>} candidates
 * @returns {{ story: object, score: number } | null}
 */
function findBestMatch(embedding, candidates) {
  let best = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(embedding, candidate.embedding);
    if (!best || score > best.score) {
      best = { story: candidate, score };
    }
  }
  return best;
}

module.exports = { cosineSimilarity, findBestMatch };
