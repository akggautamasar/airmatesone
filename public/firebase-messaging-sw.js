importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBbyAD6CG1kR0iaSx7gLwT3TfUvzbzWEQs",
  authDomain: "airmates-72301.firebaseapp.com",
  projectId: "airmates-72301",
  storageBucket: "airmates-72301.firebasestorage.app",
  messagingSenderId: "957276653373",
  appId: "1:957276653373:web:866e0c7db26c35aa6c6754"
});

const messaging = firebase.messaging();
