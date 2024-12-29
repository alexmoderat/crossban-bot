const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { getChannelsWithIds } = require('./api/helix.js');
const dotenv = require('dotenv');
dotenv.config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const db = new sqlite3.Database('./data/database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(async () => {
      db.run(`
        CREATE TABLE IF NOT EXISTS channels (
          user_id TEXT PRIMARY KEY,
          user_login TEXT
        )
      `);

      const ownerIds = config.twitch.bot.owners;
      try {
        const channels = await getChannelsWithIds(ownerIds);

        if (process.env.TWITCH_USER_ID && !ownerIds.includes(process.env.TWITCH_USER_ID)) {
          channels.data.push({
            broadcaster_id: process.env.TWITCH_USER_ID,
            broadcaster_login: process.env.TWITCH_USERNAME
          });
        }
        
        channels.data.forEach((channel) => {
          db.run(
            `INSERT OR IGNORE INTO channels (user_id, user_login)
             VALUES (?, ?)`,
            [channel.broadcaster_id, channel.broadcaster_login],
            (err) => {
              if (err) {
                console.error('Error inserting owner channel:', err.message);
              }
            }
          );
        });
        console.log('All owner channels configured successfully');
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
    });
  }
});

module.exports = { db };
