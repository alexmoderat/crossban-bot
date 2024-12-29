const { db } = require('../../database.js');
const { getUser, ban } = require('../../api/helix.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  Name: 'crossban',
  Aliases: ['cb'],
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
      const baseReason = args.slice(1).join(' ');
      const reason = baseReason
        ? `${baseReason} | Crossban originated from ${userstate.senderUsername}.`
        : `Crossban originated from ${userstate.senderUsername}.`;

      const userResponse = await getUser(username);
      if (!userResponse || !userResponse.data) {
        return {
          text: `Benutzer ${username} wurde nicht gefunden.`,
          reply: true,
        };
      }
      const targetUserId = userResponse.data[0].id;

      const channels = await new Promise((resolve, reject) => {
        db.all('SELECT user_id FROM channels', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      const banPromises = channels.map(async (channel) => {
        return ban(
          channel.user_id,
          process.env.TWITCH_USER_ID,
          targetUserId,
          reason
        ).catch((error) => {
          console.error(
            `Failed to ban in channel ID ${channel.user_id}:`,
            error
          );
          return null;
        });
      });

      await Promise.all(banPromises);

      return {
        text: `Crossban für ${username} abgeschlossen.`,
        reply: true,
      };
    } catch (error) {
      console.error('Crossban error:', error);
      return {
        text: `Ein Fehler ist aufgetreten: ${error.message}`,
        reply: true,
      };
    }
  },
};
