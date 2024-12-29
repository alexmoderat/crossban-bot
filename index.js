const config = require('./config.json');
const path = require('path');
const fs = require('fs');
const client = require('./connections/twitch/client.js');
const { setCooldown, hasCooldown } = require('./utils/cooldown.js');
const { axios } = require('axios');
const Utils = require('./utils/utils.js');
const { db } = require('./database.js');
const { sendWhisper } = require('./api/helix.js');

const commands = new Map();
const aliases = new Map();

function loadCommands() {
  const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'), {
    withFileTypes: true,
  });
  commandFolders.forEach((folder) => {
    if (!folder.isDirectory()) return;
    const commandPath = path.join(
      __dirname,
      'commands',
      folder.name,
      'index.js'
    );

    delete require.cache[require.resolve(commandPath)];

    try {
      const command = require(commandPath);
      commands.set(command.Name, command);
      if (command.Aliases) {
        command.Aliases.forEach((alias) => aliases.set(alias, command.Name));
      }
    } catch (error) {
      console.error(`Error loading command ${folder.name}:`, error);
    }
  });
}

function isAuthorized(userstate, command) {
  const isOwner = config.twitch.bot.owners.includes(userstate.senderUserID);
  const isAdmin =
    config.twitch.bot.admins.includes(userstate.senderUserID) || isOwner;
  const userBadges = userstate.badges.map((badge) => badge.name);

  if (command.Access.Global === 1 && !isAdmin) return false;
  if (command.Access.Global === 2 && !isOwner) return false;

  if (
    command.Access.Channel === 1 &&
    !userBadges.some((badge) =>
      ['vip', 'moderator', 'broadcaster'].includes(badge)
    ) &&
    !isAdmin
  ) {
    return false;
  }
  if (
    command.Access.Channel === 2 &&
    !userBadges.some((badge) => ['moderator', 'broadcaster'].includes(badge)) &&
    !isAdmin
  ) {
    return false;
  }
  if (
    command.Access.Channel === 3 &&
    !userBadges.includes('broadcaster') &&
    !isAdmin
  ) {
    return false;
  }

  return true;
}

async function handleCommand(userstate, cmd, msg, isWhisper) {
  const command = commands.get(cmd) || commands.get(aliases.get(cmd) || '');

  if (!command || !command.Enabled || !isAuthorized(userstate, command)) {
    return;
  }

  if (isWhisper && !command.WhisperEnabled) {
    await sendWhisper(
      userstate.senderUserID,
      `The command "${cmd}" cannot be used in whispers.`
    );
    return;
  }

  const cooldownKeyGlobal = `${command.Name}`;
  const cooldownKeyChannel = `${command.Name}-${userstate.channelID}`;
  const cooldownKeyUser = `${command.Name}-${userstate.senderUserID}`;
  const userCooldownWarningKey = `cooldownWarning:${userstate.senderUserID}-${userstate.channelID}-${command.Name}`;

  const globalCooldownDuration = command.Cooldown.Global;
  const channelCooldownDuration = command.Cooldown.Channel;
  const userCooldownDuration = command.Cooldown.User;

  const hasUserReceivedCooldownWarning = hasCooldown(userCooldownWarningKey);

  if (globalCooldownDuration > 0) {
    const isGlobalOnCooldown = hasCooldown(cooldownKeyGlobal);

    if (isGlobalOnCooldown) {
      const ttlGlobal = Math.ceil(isGlobalOnCooldown / 1000);
      if (!hasUserReceivedCooldownWarning) {
        await client.reply(
          userstate.channelName,
          userstate.messageID,
          `This command is on global cooldown. Please wait ${ttlGlobal} seconds before trying again.`
        );
        setCooldown(userCooldownWarningKey, Math.floor(ttlGlobal / 4));
      }
      return;
    }
    setCooldown(cooldownKeyGlobal, globalCooldownDuration);
  }

  if (channelCooldownDuration > 0) {
    const isChannelOnCooldown = hasCooldown(cooldownKeyChannel);

    if (isChannelOnCooldown) {
      const ttlChannel = Math.ceil(isChannelOnCooldown / 1000);
      if (!hasUserReceivedCooldownWarning) {
        await client.reply(
          userstate.channelName,
          userstate.messageID,
          `This command is on channel cooldown. Please wait ${ttlChannel} seconds before trying again.`
        );
        setCooldown(userCooldownWarningKey, Math.floor(ttlChannel / 4));
      }
      return;
    }
    setCooldown(cooldownKeyChannel, channelCooldownDuration);
  }

  if (userCooldownDuration > 0) {
    const isUserOnCooldown = hasCooldown(cooldownKeyUser);

    if (isUserOnCooldown) {
      const ttlUser = Math.ceil(isUserOnCooldown / 1000);
      if (!hasUserReceivedCooldownWarning) {
        await client.reply(
          userstate.channelName,
          userstate.messageID,
          `You are on cooldown for this command. Please wait ${ttlUser} seconds before trying again.`
        );
        setCooldown(userCooldownWarningKey, Math.floor(ttlUser / 4));
      }
      return;
    }
    setCooldown(cooldownKeyUser, userCooldownDuration);
  }

  try {
    const response = await command.execute(client, userstate, msg);

    if (response?.text) {
      const responseText = Array.isArray(response.text)
        ? response.text
        : [response.text];
      for (const text of responseText) {
        const formattedMessages = formatMessage(text.trim());
        for (const formattedText of formattedMessages) {
          if (isWhisper) {
            await sendWhisper(userstate.senderUserID, formattedText);
          } else {
            if (response.reply) {
              await client.reply(
                userstate.channelName,
                userstate.messageID,
                formattedText
              );
            } else {
              await client.say(userstate.channelName, formattedText);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error executing command: ${cmd}`, error);
    await client.reply(
      userstate.channelName,
      userstate.messageID,
      'Error executing command.'
    );
  }
}

function formatMessage(text) {
  const maxLength = 450;
  const messages = [];

  while (text.length > maxLength) {
    let splitIndex = text.lastIndexOf(' ', maxLength - 25);
    if (splitIndex === -1) splitIndex = maxLength;
    messages.push(text.substring(0, splitIndex));
    text = text.substring(splitIndex + 1);
  }

  if (text.length > 0) messages.push(text);
  return messages;
}

function normalizeText(text) {
  return confusables.remove(text);
}

client.on('PRIVMSG', async (userstate) => {
  const prefix = config.twitch.bot.prefix;

  if (!userstate.messageText.startsWith(prefix)) {
    return;
  }

  const sanitizedMessage = userstate.messageText.replace(/@/g, '');
  const msg = sanitizedMessage.slice(prefix.length).trim().split(/ +/);
  const cmd = msg.shift().toLowerCase();

  if (!cmd) return;

  await handleCommand(userstate, cmd, msg, false);
});

client.on('WHISPER', async (userstate) => {
  const prefix = config.twitch.bot.prefix;

  if (!userstate.messageText.startsWith(prefix)) {
    return;
  }

  const sanitizedMessage = userstate.messageText.replace(/@/g, '');
  const msg = sanitizedMessage.slice(prefix.length).trim().split(/ +/);
  const cmd = msg.shift().toLowerCase();

  await handleCommand(userstate, cmd, msg, true);
});

client.on('ready', async () => {
  console.log('Bot ready.');
  loadCommands();
});
