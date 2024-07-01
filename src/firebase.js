import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDnpwvLzEtRVpCdJhwlYXQKVQVnbnGyG1M",
  authDomain: "imagefeedex.firebaseapp.com",
  projectId: "imagefeedex",
  storageBucket: "imagefeedex.appspot.com",
  messagingSenderId: "492553849418",
  appId: "1:492553849418:web:f09f34f226cfaa7b315cfd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };