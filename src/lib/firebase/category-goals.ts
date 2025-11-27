import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { firestore as db } from './config'
import { CategoryGoal } from '@/types/portfolio'

const COLLECTION_NAME = 'categoryGoals'

// Firestore 데이터를 CategoryGoal로 변환
function convertToCategoryGoal(id: string, data: any): CategoryGoal {
  return {
    id,
    userId: data.userId,
    categoryId: data.categoryId,
    targetAmount: data.targetAmount,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

// 사용자의 모든 카테고리 목표 조회
export async function getCategoryGoals(userId: string): Promise<CategoryGoal[]> {
  if (!db) return []

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('categoryId', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => convertToCategoryGoal(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting category goals:', error)
    return []
  }
}

// 특정 카테고리 목표 조회
export async function getCategoryGoal(
  userId: string,
  categoryId: number
): Promise<CategoryGoal | null> {
  if (!db) return null

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return convertToCategoryGoal(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting category goal:', error)
    return null
  }
}

// 카테고리 목표 생성
export async function createCategoryGoal(
  data: Omit<CategoryGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CategoryGoal> {
  if (!db) throw new Error('Firebase is not configured')

  try {
    // 기존 목표가 있는지 확인
    const existingGoal = await getCategoryGoal(data.userId, data.categoryId)
    if (existingGoal) {
      // 이미 존재하면 업데이트
      return (await updateCategoryGoal(existingGoal.id, {
        targetAmount: data.targetAmount,
      })) as CategoryGoal
    }

    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })

    return {
      id: docRef.id,
      ...data,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    }
  } catch (error) {
    console.error('Error creating category goal:', error)
    throw error
  }
}

// 카테고리 목표 수정
export async function updateCategoryGoal(
  id: string,
  data: Partial<CategoryGoal>
): Promise<CategoryGoal | null> {
  if (!db) throw new Error('Firebase is not configured')

  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    const updatedDoc = await getDoc(docRef)
    if (!updatedDoc.exists()) return null

    return convertToCategoryGoal(updatedDoc.id, updatedDoc.data())
  } catch (error) {
    console.error('Error updating category goal:', error)
    throw error
  }
}

// 카테고리 목표 삭제
export async function deleteCategoryGoal(id: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured')

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
  } catch (error) {
    console.error('Error deleting category goal:', error)
    throw error
  }
}
