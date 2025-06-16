import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBbyAD6CG1kR0iaSx7gLwT3TfUvzbzWEQs",
  authDomain: "airmates-72301.firebaseapp.com",
  projectId: "airmates-72301",
  storageBucket: "airmates-72301.firebasestorage.app",
  messagingSenderId: "957276653373",
  appId: "1:957276653373:web:866e0c7db26c35aa6c6754",
  measurementId: "G-7FVF90T0K0"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestPushPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: "BLJ11N2p_-8dzWIFrGRbS2Yi0Q2Jjhrb4WVtU0AlazAuQjKMzXqO8mMwmsE-VAtY8TL0hEi01GXiHKe8WJHPpKU"
      });
      console.log("✅ FCM Token:", token);
    } else {
      console.warn("🚫 Notification permission denied");
    }
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
  }
}

onMessage(messaging, (payload) => {
  console.log("🔔 Foreground message:", payload);
  new Notification(payload.notification?.title || "Notification", {
    body: payload.notification?.body || "",
    icon: "/favicon.ico"
  });
});
