const { db } = require('../../database.js');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  Name: 'banlist',
  Aliases: ['bans', 'bl'],
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
      const bans = await getAllBans();
      if (bans.length === 0) {
        return {
          text: 'Keine gebannten User gefunden.',
          reply: true,
        };
      }

      const banList = bans
        .map((ban, index) => {
          const date = new Date(ban.timestamp);
          const formattedDate = date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return `${index + 1}. User: ${ban.user_login} (ID: ${
            ban.user_id
          })\n   Grund: ${ban.reason}\n   Datum: ${formattedDate}`;
        })
        .join('\n\n');

      const pasteUrl = await uploadToHastebin(
        `Gebannte User (${bans.length})\n${'-'.repeat(50)}\n\n${banList}`
      );
      if (!pasteUrl) {
        return {
          text: 'Error beim Hochladen der Ban-Liste.',
          reply: true,
        };
      }
      return {
        text: `Liste der gebannten User: ${pasteUrl}`,
        reply: true,
      };
    } catch (error) {
      return {
        text: 'Error beim Abrufen der Ban-Liste.',
        reply: true,
      };
    }
  },
};

function getAllBans() {
  try {
    return db
      .prepare('SELECT * FROM banned_users ORDER BY timestamp DESC')
      .all();
  } catch (error) {
    console.error('Error retrieving bans:', error.message);
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
