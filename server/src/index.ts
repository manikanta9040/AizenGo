import 'dotenv/config'
import express, { type Request } from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma'
import { hashPassword, verifyPassword } from './lib/password'
import { createSession, getSessionUser, hashToken } from './lib/session'

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

function publicUser(user: { id: string; name: string; email: string; role: string; avatar: string | null }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar ?? undefined }
}

function bearerToken(request: Request): string | null {
  const value = request.headers.authorization
  return value?.startsWith('Bearer ') ? value.slice(7) : null
}

function recordKey(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>
    for (const key of ['id', 'slug', 'month', 'name']) {
      if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key]
    }
  }
  return fallback
}

app.get('/api/health', async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`
  response.json({ status: 'ok', database: 'connected' })
})

app.post('/api/auth/register', async (request, response) => {
  const { name, email, password } = request.body as Record<string, string>
  const normalizedEmail = email?.trim().toLowerCase()

  if (!name?.trim() || !normalizedEmail || !password || password.length < 8) {
    return response.status(400).json({ message: 'Name, valid email, and an 8-character password are required.' })
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) return response.status(409).json({ message: 'An account with this email already exists.' })

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password) },
  })
  const session = await createSession(user.id)

  return response.status(201).json({ token: session.token, user: publicUser(user) })
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body as Record<string, string>
  const user = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } })

  if (!user || !(await verifyPassword(password || '', user.passwordHash))) {
    return response.status(401).json({ message: 'Invalid email or password.' })
  }

  const session = await createSession(user.id)
  return response.json({ token: session.token, user: publicUser(user) })
})

app.get('/api/auth/me', async (request, response) => {
  const token = bearerToken(request)
  const user = token ? await getSessionUser(token) : null
  if (!user) return response.status(401).json({ message: 'Authentication required.' })
  return response.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', async (request, response) => {
  const token = bearerToken(request)
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  return response.status(204).send()
})

app.post('/api/auth/forgot-password', async (request, response) => {
  const { email } = request.body as Record<string, string>
  await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } })
  return response.json({ message: 'If the account exists, password reset instructions have been requested.' })
})

app.post('/api/auth/reset-password', async (request, response) => {
  const { email, password } = request.body as Record<string, string>
  const normalizedEmail = email?.trim().toLowerCase()
  const user = normalizedEmail ? await prisma.user.findUnique({ where: { email: normalizedEmail } }) : null

  if (!user || !password || password.length < 8) {
    return response.status(400).json({ message: 'A valid email and 8-character password are required.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  })
  await prisma.session.deleteMany({ where: { userId: user.id } })
  return response.json({ message: 'Password reset successfully.' })
})

app.get('/api/users', async (_request, response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return response.json(users.map(publicUser))
})

app.get('/api/data/snapshot', async (_request, response) => {
  const records = await prisma.dataRecord.findMany({ orderBy: [{ resource: 'asc' }, { recordKey: 'asc' }] })
  const snapshot: Record<string, unknown[]> = {}

  for (const record of records) {
    if (!snapshot[record.resource]) snapshot[record.resource] = []
    snapshot[record.resource].push(record.payload)
  }

  return response.json(snapshot)
})

app.get('/api/data/:resource', async (request, response) => {
  const records = await prisma.dataRecord.findMany({
    where: { resource: request.params.resource },
    orderBy: { recordKey: 'asc' },
  })
  return response.json(records.map((record) => record.payload))
})

app.post('/api/data/:resource', async (request, response) => {
  const resource = request.params.resource
  const payload = request.body as unknown
  const key = recordKey(payload, `${resource}-${Date.now()}`)
  const record = await prisma.dataRecord.upsert({
    where: { resource_recordKey: { resource, recordKey: key } },
    update: { payload: payload as never },
    create: { id: `${resource}:${key}`, resource, recordKey: key, payload: payload as never },
  })
  return response.status(201).json(record.payload)
})

app.put('/api/data/:resource/:recordKey', async (request, response) => {
  const resource = request.params.resource
  const key = decodeURIComponent(request.params.recordKey)
  const payload = request.body as unknown
  const existing = await prisma.dataRecord.findUnique({ where: { resource_recordKey: { resource, recordKey: key } } })
  if (!existing) return response.status(404).json({ message: `Record "${key}" not found.` })
  const record = await prisma.dataRecord.update({ where: { id: existing.id }, data: { payload: payload as never } })
  return response.json(record.payload)
})

app.delete('/api/data/:resource/:recordKey', async (request, response) => {
  const resource = request.params.resource
  const key = decodeURIComponent(request.params.recordKey)
  const existing = await prisma.dataRecord.findUnique({ where: { resource_recordKey: { resource, recordKey: key } } })
  if (!existing) return response.status(404).json({ message: `Record "${key}" not found.` })
  await prisma.dataRecord.delete({ where: { id: existing.id } })
  return response.status(204).send()
})

app.use((_request, response) => response.status(404).json({ message: 'Route not found.' }))

app.listen(port, () => {
  console.log(`AizenGo API running at http://localhost:${port}`)
})
