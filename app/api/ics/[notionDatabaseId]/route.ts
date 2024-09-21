import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NextRequest, NextResponse } from 'next/server'

import { notionPagesToIcs } from '@/lib/ics'
import { getNotionDatabase } from '@/services/actions'

export const runtime = 'edge'

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const notionDatabaseId = searchParams.get('notionDatabaseId')
  if (!notionDatabaseId) {
    return NextResponse.json({ message: 'Notion database ID is required' }, { status: 400 })
  }
  const notionPages = await getNotionDatabase(notionDatabaseId)
  const ics = await notionPagesToIcs(notionPages.results as PageObjectResponse[])

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="calendar.ics"',
    },
  })
}
