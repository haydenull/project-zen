import { NextResponse, type NextRequest } from 'next/server'

import { getNotionDatabase } from '@/services/actions'

export const runtime = 'edge'

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const notionDatabaseId = searchParams.get('notionDatabaseId')
  if (!notionDatabaseId) {
    return NextResponse.json({ message: 'Notion database ID is required' }, { status: 400 })
  }

  const notionDatabase = await getNotionDatabase(notionDatabaseId)

  return NextResponse.json(notionDatabase)
}
