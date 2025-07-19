const Database = require('better-sqlite3');
const fs = require('fs');
const { getChannelsWithIds } = require('./api/helix.js');
const dotenv = require('dotenv');
dotenv.config();

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const db = new Database('./data/database.db');

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS channels (
    user_id TEXT PRIMARY KEY,
    user_login TEXT
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS banned_users (
    user_id TEXT PRIMARY KEY,
    user_login TEXT,
    reason TEXT,
    timestamp TEXT
  )
`
).run();

const configureChannels = async () => {
  try {
    const ownerIds = config.twitch.bot.owners;

    const channels = await getChannelsWithIds(ownerIds);

    if (
      process.env.TWITCH_USER_ID &&
      !ownerIds.includes(process.env.TWITCH_USER_ID)
    ) {
      channels.data.push({
        broadcaster_id: process.env.TWITCH_USER_ID,
        broadcaster_login: process.env.TWITCH_USERNAME,
      });
    }

    const insert = db.prepare(`
      INSERT OR IGNORE INTO channels (user_id, user_login)
      VALUES (?, ?)
    `);

    channels.data.forEach((channel) => {
      insert.run(channel.broadcaster_id, channel.broadcaster_login);
    });

    console.log('All owner channels configured successfully');
  } catch (err) {
    console.error('Error fetching or inserting channels:', err);
  }
};

(async () => {
  await configureChannels();
})();

module.exports = { db };
