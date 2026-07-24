'use strict';

async function helpCommand(ctx) {
  await ctx.reply(
    [
      '<b>Pulse commands</b>',
      '/start — set up Pulse',
      '/settings — view your current preferences',
      '/categories — change your categories',
      '/topics — change your topics',
      '/keywords — change your custom keyword alerts',
      '/digest — change your daily digest preference',
      '/help — show this message',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

module.exports = { helpCommand };
