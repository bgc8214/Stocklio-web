import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
  setDoc,
} from 'firebase/firestore'
import { firestore } from './config'
import { Portfolio } from '@/types/portfolio'
import { SnapshotData } from '@/lib/storage/snapshots'

// Portfolio Converter
export const portfolioConverter: FirestoreDataConverter<Portfolio> = {
  toFirestore: (portfolio: Portfolio & { userId?: string }): DocumentData => ({
    userId: portfolio.userId, // userId 필드 추가
    ticker: portfolio.ticker,
    name: portfolio.name,
    quantity: portfolio.quantity,
    averageCost: portfolio.averageCost,
    currentPrice: portfolio.currentPrice,
    market: portfolio.market,
    categoryId: portfolio.categoryId,
    createdAt: Timestamp.fromDate(portfolio.createdAt),
    updatedAt: Timestamp.fromDate(portfolio.updatedAt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot): Portfolio => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ticker: data.ticker,
      name: data.name,
      quantity: data.quantity,
      averageCost: data.averageCost,
      currentPrice: data.currentPrice,
      market: data.market,
      categoryId: data.categoryId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  },
}

// Portfolio CRUD
export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  try {
    const q = query(
      collection(firestore, 'portfolios').withConverter(portfolioConverter),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  } catch (error: any) {
    console.error('getPortfolios error:', error)
    // 인덱스 오류인 경우 orderBy 없이 재시도
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('복합 인덱스가 없어서 orderBy 없이 조회합니다.')
      const q = query(
        collection(firestore, 'portfolios').withConverter(portfolioConverter),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      // 클라이언트에서 정렬
      return snapshot.docs.map((doc) => doc.data()).sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      )
    }
    throw error
  }
}

export async function addPortfolio(
  userId: string,
  portfolio: Omit<Portfolio, 'id'>
): Promise<string> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = await addDoc(
    collection(firestore, 'portfolios').withConverter(portfolioConverter),
    { ...portfolio, userId } as Portfolio & { userId: string }
  )
  return ref.id
}

export async function updatePortfolio(
  userId: string,
  portfolioId: string,
  data: Partial<Portfolio>
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = doc(firestore, 'portfolios', portfolioId)
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deletePortfolio(
  userId: string,
  portfolioId: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = doc(firestore, 'portfolios', portfolioId)
  await deleteDoc(ref)
}

// Snapshot Converter
export const snapshotConverter: FirestoreDataConverter<SnapshotData> = {
  toFirestore: (snapshot: SnapshotData): DocumentData => ({
    totalValue: snapshot.totalValue,
    totalCost: snapshot.totalCost,
    totalProfit: snapshot.totalProfit,
    profitRate: snapshot.profitRate,
    dailyProfit: snapshot.dailyProfit,
    monthlyProfit: snapshot.monthlyProfit,
    yearlyProfit: snapshot.yearlyProfit,
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot): SnapshotData => {
    const data = snapshot.data()
    return {
      date: snapshot.id, // 문서 ID가 날짜 (YYYY-MM-DD)
      totalValue: data.totalValue,
      totalCost: data.totalCost,
      totalProfit: data.totalProfit,
      profitRate: data.profitRate,
      dailyProfit: data.dailyProfit,
      monthlyProfit: data.monthlyProfit,
      yearlyProfit: data.yearlyProfit,
    }
  },
}

// Snapshot CRUD
export async function getSnapshots(userId: string): Promise<SnapshotData[]> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  try {
    const q = query(
      collection(firestore, 'users', userId, 'snapshots'),
      orderBy('__name__', 'asc') // 문서 ID(날짜)로 정렬
    ).withConverter(snapshotConverter)

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  } catch (error: any) {
    console.error('getSnapshots error:', error)
    // 인덱스 오류인 경우 orderBy 없이 조회
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('인덱스가 없어서 orderBy 없이 조회합니다.')
      const q = query(
        collection(firestore, 'users', userId, 'snapshots')
      ).withConverter(snapshotConverter)
      const snapshot = await getDocs(q)
      // 클라이언트에서 정렬 (날짜순)
      return snapshot.docs.map((doc) => doc.data()).sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    }
    throw error
  }
}

export async function saveSnapshot(
  userId: string,
  snapshot: SnapshotData
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = doc(
    firestore,
    'users',
    userId,
    'snapshots',
    snapshot.date
  ).withConverter(snapshotConverter)

  await setDoc(ref, snapshot)
}

export async function getSnapshotByDate(
  userId: string,
  date: string
): Promise<SnapshotData | null> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = doc(
    firestore,
    'users',
    userId,
    'snapshots',
    date
  ).withConverter(snapshotConverter)

  const snapshot = await getDoc(ref)
  return snapshot.exists() ? snapshot.data() : null
}
