import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { firestore as db } from './config'

const COLLECTION_NAME = 'rebalancingTargets'

export interface RebalancingTarget {
  id: string
  userId: string
  nasdaq100: number
  sp500: number
  dividend: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 리밸런싱 목표 비율 조회
 */
export async function getRebalancingTarget(
  userId: string
): Promise<RebalancingTarget | null> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      nasdaq100: data.nasdaq100,
      sp500: data.sp500,
      dividend: data.dividend,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('리밸런싱 목표 조회 실패:', error)
    throw error
  }
}

/**
 * 리밸런싱 목표 비율 저장
 */
export async function saveRebalancingTarget(
  userId: string,
  targets: {
    nasdaq100: number
    sp500: number
    dividend: number
  }
): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, userId)
    const docSnap = await getDoc(docRef)

    const data = {
      userId,
      nasdaq100: targets.nasdaq100,
      sp500: targets.sp500,
      dividend: targets.dividend,
      updatedAt: Timestamp.now(),
    }

    if (docSnap.exists()) {
      // 업데이트
      await setDoc(docRef, data, { merge: true })
    } else {
      // 신규 생성
      await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error('리밸런싱 목표 저장 실패:', error)
    throw error
  }
}
