import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Declare global for OneSignalDeferred
declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

// Register OneSignal Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/OneSignalSDKWorker.js')
    .then(() => {
      console.log('✅ OneSignal Service Worker registered');
    })
    .catch((error) => {
      console.error('❌ OneSignal Service Worker registration failed:', error);
    });
}

// Load OneSignal SDK Script and initialize
const loadOneSignal = () => {
  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  script.defer = true;
  document.head.appendChild(script);

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: 'YOUR-ONESIGNAL-APP-ID', // ⬅️ Replace with your actual App ID
    });
  });
};

loadOneSignal(); // Load OneSignal script

// Render your App
createRoot(document.getElementById("root")!).render(<App />);
