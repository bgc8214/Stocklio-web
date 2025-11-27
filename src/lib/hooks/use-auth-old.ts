'use client'

import { useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false) // 개발 모드: 로딩 없음
  const router = useRouter()

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      router.push('/login')
      return
    }
    await firebaseSignOut(auth)
    router.push('/login')
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isFirebaseConfigured,
  }
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return '사용자를 찾을 수 없습니다'
    case 'auth/wrong-password':
      return '비밀번호가 틀렸습니다'
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다 (최소 6자)'
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다'
    case 'auth/popup-closed-by-user':
      return '팝업이 사용자에 의해 닫혔습니다'
    case 'auth/cancelled-popup-request':
      return '팝업 요청이 취소되었습니다'
    default:
      return '인증 오류가 발생했습니다'
  }
}

