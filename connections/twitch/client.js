const {
  ChatClient,
  AlternateMessageModifier,
  SlowModeRateLimiter,
} = require('@kararty/dank-twitch-irc');
const { db } = require('../../database.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new ChatClient({
  username: process.env.TWITCH_USERNAME,
  password: process.env.TWITCH_TOKEN,
  ignoreUnhandledPromiseRejections: true,
  rateLimits: 'verifiedBot',
});

client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 10));
client.connect();

async function JoinAllChannels() {
  try {
    const channels = db.prepare('SELECT user_login FROM channels').all();

    if (!channels || channels.length === 0) {
      console.log('No channels to join');
      return;
    }
    
    const channelNames = channels.map((channel) => channel.user_login);
    await client.joinAll(channelNames);
  } catch (error) {
    console.error('Error joining channels:', error);
  }
}

client.on('ready', () => {
  console.log('Bot connected.');
  JoinAllChannels();
});

client.on('JOIN', (msg) => {
  console.log(`Joined Channel: "${msg.channelName}"`);
});

module.exports = client;
