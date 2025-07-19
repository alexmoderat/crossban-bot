const { db } = require('../../database.js');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

module.exports = {
  Name: 'channels',
  Aliases: ['list'],
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
      const channels = await getAllChannels();
      if (channels.length === 0) {
        return {
          text: 'Keine Kanäle gefunden.',
          reply: true,
        };
      }
      const channelList = channels
        .map((channel, index) => `${index + 1}. ${channel}`)
        .join('\n');
      const pasteUrl = await uploadToHastebin(
        `Joined Channels (${channels.length})\n${'-'.repeat(
          30
        )}\n${channelList}`
      );
      if (!pasteUrl) {
        return {
          text: 'Error uploading the list of joined channels.',
          reply: true,
        };
      }
      return {
        text: `List of joined channels: ${pasteUrl}`,
        reply: true,
      };
    } catch (error) {
      return {
        text: 'Error retrieving the list of joined channels.',
        reply: true,
      };
    }
  },
};

function getAllChannels() {
  try {
    const rows = db.prepare('SELECT user_login FROM channels').all();
    return rows.map((row) => row.user_login);
  } catch (error) {
    console.error('Error retrieving channels:', error.message);
    return [];
  }
}

async function uploadToHastebin(data) {
  let config = {
    method: 'post',
    url: 'https://haste.potat.app/documents',
    headers: {
      'Content-Type': 'text/plain',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    },
    data: data,
  };

  try {
    const response = await axios(config);
    const key = response?.data?.key;
    if (!key) return null;
    return `https://haste.potat.app/${key}`;
  } catch (error) {
    console.error('Error uploading to hastebin:', error);
    return null;
  }
}
