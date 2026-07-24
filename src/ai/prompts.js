'use strict';

/**
 * Builds the prompt for the article summary. Kept single-purpose —
 * smaller models are far more reliable at one well-scoped task per call
 * than at multi-part instructions bundled together.
 * @param {string} headline
 * @param {string} articleText
 * @returns {{ system: string, prompt: string }}
 */
function summaryPrompt(headline, articleText) {
  return {
    system:
      'You are a precise news summarizer. Output only the summary as plain text bullet points starting with "- ". ' +
      'No preamble, no headings, no closing remarks. Do not invent facts not present in the article.',
    prompt:
      `Headline: ${headline}\n\nArticle:\n${articleText}\n\n` +
      'Write a factual summary as 5-7 bullet points, roughly 90-140 words total, in plain, easy-to-read language.',
  };
}

/**
 * Builds the prompt for the "Why It Matters" explanation.
 * @param {string} headline
 * @param {string} summary
 * @returns {{ system: string, prompt: string }}
 */
function whyItMattersPrompt(headline, summary) {
  return {
    system:
      'You explain the broader significance of news stories in one or two short paragraphs. ' +
      'Do not repeat the summary content. Output only the explanation as plain text, no headings.',
    prompt:
      `Headline: ${headline}\n\nSummary:\n${summary}\n\n` +
      'In one short paragraphs(30-50 words), explain why this news matters, its likely impact or implications. ' +
      'Do not restate the facts already in the summary.',
  };
}

/**
 * Constrained classification prompt — only used as a fallback when
 * keyword matching against the topic taxonomy finds nothing. Giving the
 * model a closed list of valid answers is far more reliable for a small
 * model than open-ended classification would be.
 * @param {string} headline
 * @param {string} excerpt
 * @param {string[]} allowedTopics
 * @returns {{ system: string, prompt: string }}
 */
function classifyTopicPrompt(headline, excerpt, allowedTopics) {
  return {
    system:
      'You classify news headlines into exactly one topic from a fixed list. ' +
      'Reply with only the topic name, exactly as written in the list, nothing else.',
    prompt:
      `Headline: ${headline}\nExcerpt: ${excerpt}\n\n` +
      `Allowed topics: ${allowedTopics.join(', ')}\n\n` +
      'Which single topic best fits this headline?',
  };
}

/**
 * Constrained yes/no significance check used by the Live Story engine to
 * decide whether a near-duplicate article actually adds meaningful new
 * information, or is just routine re-reporting of the same facts.
 * @param {string} existingSummary
 * @param {string} newArticleExcerpt
 * @returns {{ system: string, prompt: string }}
 */
function significantUpdatePrompt(existingSummary, newArticleExcerpt) {
  return {
    system:
      'You compare an existing news summary against a new article about the same event. ' +
      'Reply with only YES or NO on the first line, optionally a one sentence reason on the next line.',
    prompt:
      `Existing summary:\n${existingSummary}\n\n` +
      `New article excerpt:\n${newArticleExcerpt}\n\n` +
      'Does the new article contain materially new information (e.g. confirmed numbers, official statements, ' +
      'major developments) not already in the existing summary? Routine re-reporting of the same facts is NO.',
  };
}

module.exports = { summaryPrompt, whyItMattersPrompt, classifyTopicPrompt, significantUpdatePrompt };
