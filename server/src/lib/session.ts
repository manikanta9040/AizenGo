import { createHash, randomBytes } from 'node:crypto'
import { prisma } from './prisma'

const SESSION_DAYS = 7

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  })

  return { token, expiresAt }
}

export async function getSessionUser(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { tokenHash: session.tokenHash } })
    return null
  }

  return session.user
}
