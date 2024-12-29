const cooldown = new Map();

function setCooldown(key, duration) {
  const expireTime = Date.now() + duration * 1000;
  cooldown.set(key, expireTime);
}

function hasCooldown(key) {
  const expireTime = cooldown.get(key);
  if (expireTime && expireTime > Date.now()) {
    return expireTime - Date.now();
  } else {
    cooldown.delete(key);
    return false;
  }
}

module.exports = { setCooldown, hasCooldown };
