const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function sendWhisper(sender_id, channel_id, message) {
  let config = {
    method: 'post',
    url: `https://api.twitch.tv/helix/whispers?from_user_id=${sender_id}&to_user_id=${channel_id}`,
    headers: {
      Authorization: `Bearer ${process.env.TWITCH_TOKEN}`,
      'Client-Id': process.env.TWITCH_ID,
      'Content-Type': 'application/json',
    },
    data: {
      message: message,
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Error sending whisper:', error.response.data);
    return null;
  }
}

async function getUser(username) {
  let config = {
    method: 'get',
    url: `https://api.twitch.tv/helix/users?login=${username}`,
    headers: {
      Authorization: `Bearer ${process.env.TWITCH_TOKEN}`,
      'Client-Id': process.env.TWITCH_ID,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error.response.data);
    return null;
  }
}

async function ban(channel_id, moderator_id, user_id, reason) {
  let config = {
    method: 'post',
    url: `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${channel_id}&moderator_id=${moderator_id}`,
    headers: {
      Authorization: `Bearer ${process.env.TWITCH_TOKEN}`,
      'Client-Id': process.env.TWITCH_ID,
      'Content-Type': 'application/json',
    },
    data: {
      data: {
        user_id: user_id,
        ...(reason ? { reason: reason } : {}),
      },
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Error banning user:', error.response.data);
    return null;
  }
}

async function unban(channel_id, moderator_id, user_id) {
  let config = {
    method: 'delete',
    url: `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${channel_id}&moderator_id=${moderator_id}&user_id=${user_id}`,
    headers: {
      Authorization: `Bearer ${process.env.TWITCH_TOKEN}`,
      'Client-Id': process.env.TWITCH_ID,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Error banning user:', error.response.data);
    return null;
  }
}

async function getChannelsWithIds(channel_ids) {
  const ids = Array.isArray(channel_ids) ? channel_ids : [channel_ids];

  const results = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batchIds = ids.slice(i, i + 100);
    const params = batchIds.map((id) => `broadcaster_id=${id}`).join('&');

    let config = {
      method: 'get',
      url: `https://api.twitch.tv/helix/channels?${params}`,
      headers: {
        Authorization: `Bearer ${process.env.TWITCH_TOKEN}`,
        'Client-Id': process.env.TWITCH_ID,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await axios(config);
      results.push(...response.data.data);
    } catch (error) {
      console.error(
        `Error getting channels batch ${i / 100 + 1}:`,
        error.response.data
      );
    }
  }

  return results.length > 0 ? { data: results } : null;
}

module.exports = { sendWhisper, getUser, ban, unban, getChannelsWithIds };
