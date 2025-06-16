if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(() => {
      console.log("✅ Service Worker registered");
    })
    .catch((error) => {
      console.error("❌ Service Worker registration failed:", error);
    });
}
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
