import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyBEuwPPgt2PGlgOlswZvK4WymiMGfXAwuU',
  authDomain:        'tomitomi-planner.firebaseapp.com',
  projectId:         'tomitomi-planner',
  storageBucket:     'tomitomi-planner.firebasestorage.app',
  messagingSenderId: '257624269726',
  appId:             '1:257624269726:web:edbc928d1530ac8d2fec8f',
}

export const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
