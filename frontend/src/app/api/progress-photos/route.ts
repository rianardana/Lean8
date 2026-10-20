import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { wibDate } from '@/lib/time'

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const comma = dataUrl.indexOf(',')
  const mime = dataUrl.slice(0, comma).match(/data:([^;]+)/)?.[1] ?? 'image/webp'
  return { buffer: Buffer.from(dataUrl.slice(comma + 1), 'base64'), mime }
}

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const photos = await prisma.progressPhoto.findMany({ where: { userId }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { image, date } = (await req.json()) as { image: string; date?: string }
  if (!image) return NextResponse.json({ error: 'image required' }, { status: 400 })

  try {
    const { buffer, mime } = dataUrlToBuffer(image)
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'webp'
    const { url } = await put(`progress/${userId}/${Date.now()}.${ext}`, buffer, { access: 'public', contentType: mime })
    const photo = await prisma.progressPhoto.create({
      data: { userId, date: date || wibDate(), url },
    })
    return NextResponse.json(photo)
  } catch (err) {
    console.error('BLOB UPLOAD ERROR:', err)
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const photo = await prisma.progressPhoto.findFirst({ where: { id, userId } })
  if (!photo) return NextResponse.json({ ok: true })
  await prisma.progressPhoto.delete({ where: { id } })
  await del(photo.url).catch(() => {}) // foto sudah hilang di blob = bukan error fatal
  return NextResponse.json({ ok: true })
}
