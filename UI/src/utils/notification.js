// Utility for Browser & Mobile OS System Notifications via Service Worker

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service Worker registration failed:', err.message);
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;

  // Auto-register Service Worker for Mobile OS background push
  registerServiceWorker();

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

export const sendSystemNotification = async (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: options.tag || 'chatapp-msg',
    renotify: true,
    ...options
  };

  // 1. Mobile OS & Service Worker Notification (Works when app/browser is minimized!)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerServiceWorker();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. Desktop Browser Fallback
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
    };
  } catch (err) {
    console.error('Error sending system notification:', err);
  }
};
