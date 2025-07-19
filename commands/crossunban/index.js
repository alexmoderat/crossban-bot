const { db } = require('../../database.js');
const { getUser, unban } = require('../../api/helix.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  Name: 'crossunban',
  Aliases: ['cub'],
  Enabled: true,
  WhisperEnabled: true,

  Access: {
    Global: 1,
    Channel: 0,
  },

  Cooldown: {
    Global: 0,
    Channel: 0,
    User: 5,
  },

  Response: 1,

  execute: async (client, userstate, args) => {
    try {
      if (!args[0]) {
        return {
          text: 'Bitte gib einen Twitch-Benutzernamen an.',
          reply: true,
        };
      }

      const username = args[0].toLowerCase();

      const userResponse = await getUser(username);
      if (!userResponse || !userResponse.data) {
        return {
          text: `Benutzer ${username} wurde nicht gefunden.`,
          reply: true,
        };
      }
      const targetUserId = userResponse.data[0].id;

      db.prepare(
        `
        DELETE FROM banned_users
        WHERE user_id = ?
      `
      ).run(targetUserId);

      const channels = db.prepare('SELECT user_id FROM channels').all();

      if (channels.length === 0) {
        return {
          text: 'Keine Kanäle gefunden, um Unbans durchzuführen.',
          reply: true,
        };
      }

      const unbanPromises = channels.map(async (channel) => {
        return unban(
          channel.user_id,
          process.env.TWITCH_USER_ID,
          targetUserId
        ).catch((error) => {
          console.error(
            `Failed to unban in channel ID ${channel.user_id}:`,
            error
          );
          return null;
        });
      });

      await Promise.all(unbanPromises);

      return {
        text: `Crossunban für ${username} abgeschlossen.`,
        reply: true,
      };
    } catch (error) {
      console.error('Crossunban error:', error);
      return {
        text: `Ein Fehler ist aufgetreten: ${error.message}`,
        reply: true,
      };
    }
  },
};
