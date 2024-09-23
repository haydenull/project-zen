import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { createEvents } from 'ics'
import { NextRequest, NextResponse } from 'next/server'

import { filterIcsEventsByHoliday, notionPagesToIcsEvents } from '@/lib/ics'
import { getNotionDatabase } from '@/services/actions'

export const runtime = 'edge'

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const notionDatabaseId = searchParams.get('notionDatabaseId')
  if (!notionDatabaseId) {
    return NextResponse.json({ message: 'Notion database ID is required' }, { status: 400 })
  }
  const notionPages = await getNotionDatabase(notionDatabaseId)
  const events = notionPagesToIcsEvents(notionPages.results as PageObjectResponse[])

  const { error, value: ics } = createEvents(await filterIcsEventsByHoliday(events, 2024))

  if (error) {
    return NextResponse.json({ message: error }, { status: 500 })
  }

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="calendar.ics"',
    },
  })
}
