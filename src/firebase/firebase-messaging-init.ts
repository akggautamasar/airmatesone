 import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBbyAD6CG1kR0iaSx7gLwT3TfUvzbzWEQs",
  authDomain: "airmates-72301.firebaseapp.com",
  projectId: "airmates-72301",
  storageBucket: "airmates-72301.appspot.com",
  messagingSenderId: "957276653373",
  appId: "1:957276653373:web:866e0c7db26c35aa6c6754",
  measurementId: "G-7FVF90T0K0"
};

let messaging: ReturnType<typeof getMessaging> | null = null;

export function initializeFirebaseApp() {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
}

export function requestPushPermission() {
  if (!messaging) return;
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      getToken(messaging, {
        vapidKey: "BLJ11N2p_-8dzWIFrGRbS2Yi0Q2Jjhrb4WVtU0AlazAuQjKMzXqO8mMwmsE-VAtY8TL0hEi01GXiHKe8WJHPpKU"
      }).then(currentToken => {
        if (currentToken) {
          console.log("📬 Token received:", currentToken);
        } else {
          console.log("⚠️ No registration token available.");
        }
      }).catch(err => console.error("❌ Token error:", err));
    }
  });
}
