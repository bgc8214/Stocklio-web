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
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebase/config'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export interface AuthUser extends User {
  displayName: string | null
  photoURL: string | null
}

export function useAuthImproved() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      setInitializing(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as AuthUser)

        // Firestore에 사용자 정보 동기화
        if (firestore) {
          await syncUserToFirestore(firebaseUser)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
      setInitializing(false)
    })

    return unsubscribe
  }, [])

  // Firestore에 사용자 정보 저장/업데이트
  const syncUserToFirestore = async (firebaseUser: User) => {
    if (!firestore) return

    const userRef = doc(firestore, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userRef)

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      lastLoginAt: serverTimestamp(),
    }

    if (!userDoc.exists()) {
      // 새 사용자 - 생성일 추가
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      })
    } else {
      // 기존 사용자 - 업데이트
      await setDoc(userRef, userData, { merge: true })
    }
  }

  // 이메일/비밀번호로 회원가입
  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // 프로필 업데이트 (이름 설정)
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // 이메일 인증 메일 발송
      await sendEmailVerification(userCredential.user)

      // Firestore에 사용자 정보 저장
      if (firestore) {
        await setDoc(doc(firestore, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName || null,
          photoURL: null,
          emailVerified: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        })
      }

      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 이메일/비밀번호로 로그인
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

  // Google로 로그인/회원가입
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

  // 로그아웃
  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      router.push('/login')
      return
    }
    await firebaseSignOut(auth)
    router.push('/login')
  }

  // 이메일 인증 메일 재전송
  const resendVerificationEmail = async () => {
    if (!auth?.currentUser) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      await sendEmailVerification(auth.currentUser)
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 비밀번호 재설정 이메일 발송
  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }

    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 프로필 업데이트
  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!auth?.currentUser) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      await updateProfile(auth.currentUser, { displayName, photoURL })

      // Firestore 동기화
      if (firestore) {
        await setDoc(
          doc(firestore, 'users', auth.currentUser.uid),
          {
            displayName: displayName || null,
            photoURL: photoURL || null,
          },
          { merge: true }
        )
      }
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 이메일 변경
  const changeEmail = async (newEmail: string, currentPassword: string) => {
    if (!auth?.currentUser || !auth.currentUser.email) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      // 재인증
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // 이메일 변경
      await updateEmail(auth.currentUser, newEmail)

      // 새 이메일로 인증 메일 발송
      await sendEmailVerification(auth.currentUser)

      // Firestore 동기화
      if (firestore) {
        await setDoc(
          doc(firestore, 'users', auth.currentUser.uid),
          {
            email: newEmail,
            emailVerified: false,
          },
          { merge: true }
        )
      }
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 비밀번호 변경
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth?.currentUser || !auth.currentUser.email) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      // 재인증
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // 비밀번호 변경
      await updatePassword(auth.currentUser, newPassword)
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  // 계정 삭제
  const deleteAccount = async (password: string) => {
    if (!auth?.currentUser || !auth.currentUser.email) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      // 재인증
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Firestore에서 사용자 데이터 삭제
      if (firestore) {
        // 여기서 사용자의 모든 데이터를 삭제해야 함 (포트폴리오, 스냅샷 등)
        // TODO: 실제 구현 시 사용자의 모든 문서 삭제
      }

      // 계정 삭제
      await auth.currentUser.delete()
      router.push('/')
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  return {
    user,
    loading,
    initializing,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    resetPassword,
    updateUserProfile,
    changeEmail,
    changePassword,
    deleteAccount,
    isFirebaseConfigured,
  }
}

// 에러 메시지 한글화
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return '등록되지 않은 이메일입니다'
    case 'auth/wrong-password':
      return '비밀번호가 올바르지 않습니다'
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다 (최소 6자)'
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다'
    case 'auth/popup-closed-by-user':
      return '팝업이 닫혔습니다'
    case 'auth/cancelled-popup-request':
      return '팝업 요청이 취소되었습니다'
    case 'auth/too-many-requests':
      return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요'
    case 'auth/user-disabled':
      return '비활성화된 계정입니다'
    case 'auth/requires-recent-login':
      return '보안을 위해 다시 로그인해주세요'
    case 'auth/invalid-credential':
      return '인증 정보가 올바르지 않습니다'
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다'
    default:
      return '인증 오류가 발생했습니다'
  }
}
