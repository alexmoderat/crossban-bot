const { db } = require('../../database.js');
const { getUser } = require('../../api/helix.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  Name: 'join',
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

      if (existingChannel) {
        return {
          text: `${username} bereits beigetreten!`,
          reply: true
        };
      }

      const response = await getUser(username);
      if (!response || !response.data) {
        console.error(`Benutzer ${username} wurde nicht gefunden.`);
        return;
      }
      const userId = response.data[0].id;

      await new Promise((resolve, reject) => {
        db.run('INSERT INTO channels (user_id, user_login) VALUES (?, ?)', [userId, username], (err) => {
          if (err) {
            reject(err);
          } else {
            if (!(client.joinedChannels.has(username))) {
              client.join(username);
            }
            resolve();
          }
        });
      });

      return {
        text: `Beigetreten ${username}!`,
        reply: true
      };
    } catch (error) {
      return { text: `${error.message}`, reply: true };
    }
  },
};
