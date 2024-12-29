const { db } = require('../../database.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  Name: 'leave',
  Aliases: [],
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
          text: "Bitte gib einen Twitch-Benutzernamen an.",
          reply: true
        };
      }

      const username = args[0].toLowerCase();

      const existingChannel = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM channels WHERE user_login = ?', [username], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      if (!existingChannel) {
        return {
          text: `Der Bot ist ${username} nicht beigetreten!`,
          reply: true
        };
      }

      await new Promise((resolve, reject) => {
        db.run('DELETE FROM channels WHERE user_login = ?', [username], (err) => {
          if (err) {
            reject(err);
          } else {
            if (client.joinedChannels.has(username)) {
              client.part(username);
            }
            resolve();
          }
        });
      });

      return {
        text: `Der Bot hat ${username} verlassen!`,
        reply: true
      };
    } catch (error) {
      return { text: `${error.message}`, reply: true };
    }
  },
};
