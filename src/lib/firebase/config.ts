import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase 설정 확인
const isFirebaseConfigured = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId

// Firebase 싱글톤
let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null
let storage: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    firestore = getFirestore(app)
    storage = getStorage(app)
  } else {
    app = getApps()[0]
    auth = getAuth(app)
    firestore = getFirestore(app)
    storage = getStorage(app)
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Firebase가 설정되지 않았습니다. .env.local 파일에 Firebase 설정을 추가하세요.'
    )
  }
}

export { app, auth, firestore, storage, isFirebaseConfigured }
