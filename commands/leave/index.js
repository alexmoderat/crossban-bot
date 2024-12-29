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
          text: 'Bitte gib einen Twitch-Benutzernamen an.',
          reply: true,
        };
      }

      const username = args[0].toLowerCase();

      const existingChannel = db
        .prepare('SELECT * FROM channels WHERE user_login = ?')
        .get(username);

      if (!existingChannel) {
        return {
          text: `Der Bot ist ${username} nicht beigetreten!`,
          reply: true,
        };
      }

      db.prepare('DELETE FROM channels WHERE user_login = ?').run(username);

      if (client.joinedChannels.has(username)) {
        client.part(username);
      }

      return {
        text: `Der Bot hat ${username} verlassen!`,
        reply: true,
      };
    } catch (error) {
      return { text: `${error.message}`, reply: true };
    }
  },
};
