const { db } = require('../../database.js');
const { getUser, ban } = require('../../api/helix.js');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

module.exports = {
  Name: 'masscrossban',
  Aliases: ['mcb'],
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
          text: 'Bitte gib eine Paste-URL und optional einen Standard-Grund an.',
          reply: true,
        };
      }

      const pasteUrl = args[0];
      const defaultReason = args.slice(1).join(' ');

      const response = await axios.get(pasteUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (response.status !== 200) {
        return {
          text: 'Konnte die Paste-URL nicht laden.',
          reply: true,
        };
      }

      const content = response.data;
      const userLines = content.split('\n').filter((line) => line.trim());

      const channels = db.prepare('SELECT user_id FROM channels').all();

      if (channels.length === 0) {
        return {
          text: 'Keine Kanäle gefunden, um Bans durchzuführen.',
          reply: true,
        };
      }

      const banPromises = userLines.map(async (line) => {
        const [username, ...reasonParts] = line.trim().split(' ');
        const specificReason =
          reasonParts.length > 0 ? reasonParts.join(' ') : defaultReason;
        const finalReason = specificReason
          ? `${specificReason} | Crossban originated from ${userstate.senderUsername}.`
          : `Crossban originated from ${userstate.senderUsername}.`;

        try {
          const userResponse = await getUser(username.toLowerCase());
          if (!userResponse || !userResponse.data) {
            console.error(`Benutzer ${username} wurde nicht gefunden.`);
            return;
          }

          const targetUserId = userResponse.data[0].id;
          const timestamp = new Date().toISOString();

          db.prepare(
            `
            INSERT OR REPLACE INTO banned_users (user_id, user_login, reason, timestamp)
            VALUES (?, ?, ?, ?)
          `
          ).run(targetUserId, username, finalReason, timestamp);

          const channelBanPromises = channels.map((channel) =>
            ban(
              channel.user_id,
              process.env.TWITCH_USER_ID,
              targetUserId,
              finalReason
            ).catch((error) => {
              console.error(
                `Failed to ban ${username} in channel ${channel.user_id}:`,
                error
              );
            })
          );

          await Promise.allSettled(channelBanPromises);
        } catch (error) {
          console.error(`Error processing user ${username}:`, error);
        }
      });

      await Promise.allSettled(banPromises);

      return {
        text: `Masscrossban abgeschlossen.`,
        reply: true,
      };
    } catch (error) {
      console.error('Masscrossban error:', error);
      return {
        text: `Ein Fehler ist aufgetreten: ${error.message}`,
        reply: true,
      };
    }
  },
};
