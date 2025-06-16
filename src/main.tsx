import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeFirebaseApp, requestPushPermission } from './firebase/firebase-messaging-init';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(() => {
      console.log("✅ Service Worker registered");
      initializeFirebaseApp(); // Firebase init
      requestPushPermission(); // Ask for permission
    })
    .catch((error) => {
      console.error("❌ Service Worker registration failed:", error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
