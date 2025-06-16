import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register the OneSignal service worker
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

// Dynamically add OneSignal script and init block to <head>
const addOneSignalScript = () => {
  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  script.defer = true;
  document.head.appendChild(script);

  // Add OneSignal initialization inline script
  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: "2760e048-8446-4905-8b45-064aa23e525c",
      });
    });
  `;
  document.head.appendChild(inlineScript);
};

addOneSignalScript(); // Run the function

// Render your App
createRoot(document.getElementById("root")!).render(<App />);
