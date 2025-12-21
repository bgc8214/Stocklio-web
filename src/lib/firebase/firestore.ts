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
import { Portfolio, DailySnapshot } from '@/types/portfolio'
import { SnapshotData } from '@/lib/storage/snapshots'

// Portfolio Converter
export const portfolioConverter: FirestoreDataConverter<Portfolio> = {
  toFirestore: (portfolio: Portfolio): DocumentData => {
    const data: DocumentData = {
      ticker: portfolio.ticker,
      name: portfolio.name,
      quantity: portfolio.quantity,
      averageCost: portfolio.averageCost,
      currentPrice: portfolio.currentPrice,
      market: portfolio.market,
      createdAt: Timestamp.fromDate(portfolio.createdAt),
      updatedAt: Timestamp.fromDate(portfolio.updatedAt),
    }

    // categoryId가 undefined가 아닐 때만 추가
    if (portfolio.categoryId !== undefined) {
      data.categoryId = portfolio.categoryId
    }

    return data
  },
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

  const q = query(
    collection(firestore, 'portfolios', userId, 'stocks'),
    orderBy('createdAt', 'desc')
  ).withConverter(portfolioConverter)

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data())
}

export async function addPortfolio(
  userId: string,
  portfolio: Omit<Portfolio, 'id'>
): Promise<string> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = await addDoc(
    collection(firestore, 'portfolios', userId, 'stocks').withConverter(
      portfolioConverter
    ),
    portfolio as Portfolio
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

  // undefined 값 제거
  const updateData: any = {
    updatedAt: Timestamp.now(),
  }

  Object.keys(data).forEach((key) => {
    const value = (data as any)[key]
    if (value !== undefined) {
      updateData[key] = value
    }
  })

  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
  await updateDoc(ref, updateData)
}

export async function deletePortfolio(
  userId: string,
  portfolioId: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore가 초기화되지 않았습니다.')
  }

  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
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

  const q = query(
    collection(firestore, 'portfolios', userId, 'snapshots'),
    orderBy('__name__', 'asc') // 문서 ID(날짜)로 정렬
  ).withConverter(snapshotConverter)

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data())
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
    'portfolios',
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
    'portfolios',
    userId,
    'snapshots',
    date
  ).withConverter(snapshotConverter)

  const snapshot = await getDoc(ref)
  return snapshot.exists() ? snapshot.data() : null
}
