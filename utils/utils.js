const crypto = require('crypto');

class Utils {
  static generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    let days = now.getDate() - date.getDate();
    let hours = now.getHours() - date.getHours();
    let minutes = now.getMinutes() - date.getMinutes();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (hours < 0) {
      days--;
      hours += 24;
    }

    if (minutes < 0) {
      hours--;
      minutes += 60;
    }

    const timeParts = [];
    if (years > 0) timeParts.push({ value: years, label: `${years}y` });
    if (months > 0) timeParts.push({ value: months, label: `${months}mo` });
    if (days > 0) timeParts.push({ value: days, label: `${days}d` });
    if (hours > 0) timeParts.push({ value: hours, label: `${hours}h` });
    if (minutes > 0) timeParts.push({ value: minutes, label: `${minutes}m` });

    const orderedParts = [
      { value: years, label: `${years}y` },
      { value: months, label: `${months}mo` },
      { value: days, label: `${days}d` },
      { value: hours, label: `${hours}h` },
      { value: minutes, label: `${minutes}m` },
    ].filter((part) => part.value > 0);

    const selectedParts = orderedParts.slice(0, 3).map((part) => part.label);

    if (selectedParts.length === 0) {
      return 'Just now';
    }

    if (selectedParts.length === 1) {
      return selectedParts[0];
    }

    const lastPart = selectedParts.pop();
    return `${selectedParts.join(', ')} and ${lastPart}`;
  }

  static formatDuration(seconds) {
    const weeks = Math.floor(seconds / (7 * 24 * 3600));
    const days = Math.floor((seconds % (7 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts = [];
    if (weeks > 0) parts.push(`${weeks} Woche${weeks === 1 ? '' : 'n'}`);
    if (days > 0) parts.push(`${days} Tag${days === 1 ? '' : 'e'}`);
    if (hours > 0) parts.push(`${hours} Stunde${hours === 1 ? '' : 'n'}`);
    if (minutes > 0) parts.push(`${minutes} Minute${minutes === 1 ? '' : 'n'}`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(
        `${remainingSeconds} Sekunde${remainingSeconds === 1 ? '' : 'n'}`
      );

    if (parts.length === 1) {
      return parts[0];
    }

    return parts.slice(0, -1).join(', ') + ' und ' + parts[parts.length - 1];
  }
}

module.exports = Utils;
