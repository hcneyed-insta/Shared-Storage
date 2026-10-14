import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileTable } from '@/components/drive/FileTable'
import { PageHeader } from '@/components/drive/PageHeader'
import type { FileItem } from '@/data/drive-data'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'

type BackendFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  createdAt: string
  starredAt: string | null
  folder?: { name: string } | null
  connectedAccount?: { email: string; provider: string }
}

function mapFile(file: BackendFile): FileItem {
  const kind: FileItem['kind'] = file.mimeType.startsWith('image/')
    ? 'image'
    : file.mimeType.startsWith('video/')
      ? 'video'
      : file.mimeType.includes('pdf')
        ? 'pdf'
        : 'doc'

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    size: formatBytes(file.sizeBytes),
    createdAt: file.createdAt,
    date: formatDate(file.createdAt),
    starredAt: file.starredAt,
    starredDate: file.starredAt ? formatDate(file.starredAt) : undefined,
    folderName: file.folder?.name,
    accountEmail: file.connectedAccount?.email,
    accountProvider: file.connectedAccount?.provider,
    access: file.connectedAccount?.email ?? 'Only You',
    kind,
    shared: 0,
  }
}

export function StarredPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  async function loadFiles(cursor?: string) {
    const params = new URLSearchParams({ starred: 'true', limit: '100' })
    if (cursor) params.set('cursor', cursor)
    const response = await apiFetch<{ files: BackendFile[]; nextCursor: string | null }>(`/files?${params}`)
    const mapped = response.files.map(mapFile)
    setFiles((current) => cursor ? [...current, ...mapped] : mapped)
    setNextCursor(response.nextCursor)
  }

  useEffect(() => {
    loadFiles()
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load starred files.'))
      .finally(() => setLoading(false))
  }, [])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      await loadFiles(nextCursor)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load more files.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <PageHeader title="Starred" description="Files you have pinned for quick access." />
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading starred files...</p> : files.length === 0 ? (
        <Card className="mt-6 p-5"><p className="text-sm text-slate-500">No starred files yet.</p></Card>
      ) : (
        <>
          <Card className="mt-6 p-4 sm:p-5"><FileTable files={files} mode="starred" /></Card>
          {nextCursor ? <div className="mt-4 flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading...' : 'Load more files'}</Button></div> : null}
        </>
      )}
    </>
  )
}
