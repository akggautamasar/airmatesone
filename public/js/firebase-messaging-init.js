// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBbyAD6CG1kR0iaSx7gLwT3TfUvzbzWEQs",
  authDomain: "airmates-72301.firebaseapp.com",
  projectId: "airmates-72301",
  storageBucket: "airmates-72301.firebasestorage.app",
  messagingSenderId: "957276653373",
  appId: "1:957276653373:web:866e0c7db26c35aa6c6754",
  measurementId: "G-7FVF90T0K0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Ask for permission & get token
export async function requestPushPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: "BLJ11N2p_-8dzWIFrGRbS2Yi0Q2Jjhrb4WVtU0AlazAuQjKMzXqO8mMwmsE-VAtY8TL0hEi01GXiHKe8WJHPpKU"
      });
      console.log("✅ FCM Token:", token);
      // You can optionally send this token to your DB
    } else {
      console.warn("🚫 Notification permission not granted");
    }
  } catch (error) {
    console.error("❌ Error fetching FCM token:", error);
  }
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("🔔 Foreground message:", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/favicon.ico"
  });
});
