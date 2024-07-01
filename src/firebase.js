import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDnpwvLzEtRVpCdJhwlYXQKVQVnbnGyG1M",
  authDomain: "imagefeedex.firebaseapp.com",
  projectId: "imagefeedex",
  storageBucket: "imagefeedex.appspot.com",
  messagingSenderId: "934566000494",
  appId: "1:934566000494:web:c0974b521420c0e7e3b37f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };





