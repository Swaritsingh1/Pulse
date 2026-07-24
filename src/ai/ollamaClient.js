'use strict';

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Strips <think>...</think> reasoning blocks that qwen3 and other hybrid
 * reasoning models can still emit even with thinking disabled — this is
 * a defensive safety net, not the primary control mechanism.
 * @param {string} text
 * @returns {string}
 */
function stripThinking(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Calls a local Ollama chat model. Thinking mode is disabled by default
 * (`think: false`) — this task only needs direct, well-formatted text
 * generation, and skipping the reasoning trace noticeably cuts latency on
 * a small model like qwen3:1.7b. Requires a reasonably recent Ollama
 * version that supports the `think` field; stripThinking() above is a
 * fallback in case an older Ollama ignores it.
 * @param {{ system?: string, prompt: string, temperature?: number }} options
 * @returns {Promise<string>}
 */
async function generate({ system, prompt, temperature = 0.3 }) {
  try {
    const response = await axios.post(
      `${config.ollama.baseUrl}/api/generate`,
      {
        model: config.ollama.chatModel,
        system,
        prompt,
        stream: false,
        think: false,
        options: { temperature },
      },
      { timeout: 60000 },
    );
    return stripThinking(response.data.response);
  } catch (err) {
    logger.error({ err: err.message }, 'Ollama generate() call failed');
    throw err;
  }
}

/**
 * Calls a local Ollama embedding model (default: nomic-embed-text).
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embed(text) {
  try {
    const response = await axios.post(
      `${config.ollama.baseUrl}/api/embeddings`,
      { model: config.ollama.embedModel, prompt: text },
      { timeout: 30000 },
    );
    return response.data.embedding;
  } catch (err) {
    logger.error({ err: err.message }, 'Ollama embed() call failed');
    throw err;
  }
}

module.exports = { generate, embed, stripThinking };
