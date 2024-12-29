const { db } = require('../../database.js');
const { getUser, unban } = require('../../api/helix.js');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

module.exports = {
  Name: 'masscrossunban',
  Aliases: ['mcub'],
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
          text: 'Bitte gib eine Paste-URL an.',
          reply: true,
        };
      }

      const pasteUrl = args[0];
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

      const channels = await new Promise((resolve, reject) => {
        db.all('SELECT user_id FROM channels', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const unbanPromises = userLines.map(async (line) => {
        const [username] = line.trim().split(' ');
        try {
          const userResponse = await getUser(username.toLowerCase());
          if (!userResponse || !userResponse.data) {
            console.error(`User not found: ${username}`);
            return;
          }

          const targetUserId = userResponse.data[0].id;

          const channelUnbanPromises = channels.map((channel) =>
            unban(
              channel.user_id,
              process.env.TWITCH_USER_ID,
              targetUserId
            ).catch((error) => {
              console.error(
                `Failed to unban ${username} in channel ${channel.user_id}:`,
                error
              );
            })
          );

          await Promise.allSettled(channelUnbanPromises);
        } catch (error) {
          console.error(`Error processing user ${username}:`, error);
        }
      });

      await Promise.allSettled(unbanPromises);

      return {
        text: `Masscrossunban abgeschlossen.`,
        reply: true,
      };
    } catch (error) {
      console.error('Masscrossunban error:', error);
      return {
        text: `Ein Fehler ist aufgetreten: ${error.message}`,
        reply: true,
      };
    }
  },
};
