import { MongoClient, Db, Collection, Document, ObjectId } from 'mongodb'

// Für Vercel: MONGODB_URI muss gesetzt sein
// Lokale Entwicklung: Fallback auf localhost
const uri = process.env.MONGODB_URI || 
  (process.env.NODE_ENV === 'development' 
    ? 'mongodb://localhost:27017/servecta_admin' 
    : (() => {
        throw new Error(
          'DATABASE_URL is required in production. ' +
          'Please set it in your Vercel project settings.'
        )
      })())

const options = {
  // Optimierungen für Vercel Serverless
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db('servecta_admin')
  } catch (error) {
    console.error('Database connection error:', error)
    console.error('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await getDatabase()
  return db.collection<T>(name)
}

// Collection helpers for all models
export const collections = {
  // Separate user collections
  staff: () => getCollection('staff'),
  consumers: () => getCollection('consumers'),
  // Legacy users collection (for backward compatibility)
  users: () => getCollection('users'),
  customers: () => getCollection('customers'),
  contacts: () => getCollection('contacts'),
  addresses: () => getCollection('addresses'),
  projects: () => getCollection('projects'),
  tasks: () => getCollection('tasks'),
  comments: () => getCollection('comments'),
  tickets: () => getCollection('tickets'),
  quotes: () => getCollection('quotes'),
  auditLogs: () => getCollection('auditLogs'),
  settings: () => getCollection('settings'),
  notifications: () => getCollection('notifications'),
  accounts: () => getCollection('accounts'),
  sessions: () => getCollection('sessions'),
  verificationTokens: () => getCollection('verificationTokens'),
}

// Helper function to find user in both collections
export async function findUserById(userId: string) {
  const [staffCollection, consumersCollection] = await Promise.all([
    collections.staff(),
    collections.consumers()
  ])
  
  const [staffUser, consumerUser] = await Promise.all([
    staffCollection.findOne({ _id: new ObjectId(userId) }),
    consumersCollection.findOne({ _id: new ObjectId(userId) })
  ])
  
  return staffUser || consumerUser
}

// Helper function to find user by email in both collections
export async function findUserByEmail(email: string) {
  const [staffCollection, consumersCollection] = await Promise.all([
    collections.staff(),
    collections.consumers()
  ])
  
  const [staffUser, consumerUser] = await Promise.all([
    staffCollection.findOne({ email }),
    consumersCollection.findOne({ email })
  ])
  
  return staffUser || consumerUser
}
