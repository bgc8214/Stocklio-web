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
} from 'firebase/firestore'
import { firestore } from './config'
import { Portfolio, DailySnapshot } from '@/types/portfolio'

// Portfolio Converter
export const portfolioConverter: FirestoreDataConverter<Portfolio> = {
  toFirestore: (portfolio: Portfolio): DocumentData => ({
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

  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
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

  const ref = doc(firestore, 'portfolios', userId, 'stocks', portfolioId)
  await deleteDoc(ref)
}
