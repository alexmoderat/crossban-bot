const { db } = require('../../database.js');

module.exports = {
  Name: 'ping',
  Aliases: [],
  Enabled: true,
  WhisperEnabled: true,

  Access: {
    Global: 0,
    Channel: 0,
  },

  Cooldown: {
    Global: 0,
    Channel: 0,
    User: 5,
  },

  Response: 1,

  execute: async (client, userstate, args) => {
    const uptimeSeconds = Math.floor(process.uptime());

    const formatUptime = (secs) => {
      const h = Math.floor(secs / 3600).toString().padStart(2, '0');
      const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    let channelCount = 0;
    try {
      const rows = db.prepare('SELECT COUNT(*) AS count FROM channels').get();
      channelCount = rows?.count || 0;
    } catch (error) {
      console.error('Error retrieving channel count:', error.message);
    }

    return {
      text: `Pong! Bot has been running for ${formatUptime(uptimeSeconds)}. Connected channels: ${channelCount}.`,
      reply: true,
    };
  },
};
