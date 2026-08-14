// Utility for Browser System Notifications & Permission Requests

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }

  return false;
};

export const sendSystemNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
    };
  } catch (err) {
    console.error('Error sending system notification:', err);
  }
};
