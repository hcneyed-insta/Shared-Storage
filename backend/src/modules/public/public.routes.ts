import { Router } from 'express'
import { prisma } from '../../config/prisma.js'
import { hashToken } from '../../utils/crypto.js'
import { streamProviderFile } from '../files/stream-file.js'
import { getDirectS3FileUrl } from '../s3/s3.service.js'

export const publicRouter = Router()

async function findSharedFile(token: string) {
  const share = await prisma.fileShare.findFirst({
    where: { enabled: true, AND: [{ OR: [{ token }, { tokenHash: hashToken(token) }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] },
    include: { file: { include: { connectedAccount: true } } },
  })
  if (!share || share.file.status !== 'active') throw new Error('Shared file not found')
  return share.file
}

publicRouter.get('/files/:token', async (req, res, next) => {
  try {
    const file = await findSharedFile(String(req.params.token))
    return res.json({ file: { id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: file.sizeBytes.toString(), createdAt: file.createdAt, provider: file.provider } })
  } catch (error) {
    return next(error)
  }
})

publicRouter.get('/files/:token/direct-url', async (req, res, next) => {
  try {
    const file = await findSharedFile(String(req.params.token))
    const disposition = String(req.query.disposition ?? 'attachment') === 'inline' ? 'inline' : 'attachment'
    if (file.provider !== 's3') return res.json({ url: null, provider: file.provider })
    return res.json({ url: await getDirectS3FileUrl(file, { disposition }), provider: file.provider })
  } catch (error) {
    return next(error)
  }
})

publicRouter.get('/files/:token/download', async (req, res, next) => {
  try {
    const file = await findSharedFile(String(req.params.token))
    return streamProviderFile(file, req.headers.range, res, { disposition: 'attachment' })
  } catch (error) {
    return next(error)
  }
})

publicRouter.get('/files/:token/preview', async (req, res, next) => {
  try {
    const file = await findSharedFile(String(req.params.token))
    return streamProviderFile(file, req.headers.range, res, { disposition: 'inline' })
  } catch (error) {
    return next(error)
  }
})
