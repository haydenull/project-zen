import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import dayjs from 'dayjs'
import { createEvents } from 'ics'
import { NextRequest, NextResponse } from 'next/server'

import { filterEventsByRestDay, notionPagesToEvents } from '@/lib/event'
import { eventToIcsEvent, getRestDays } from '@/lib/ics'
import { getNotionDatabase } from '@/services/actions'

export const runtime = 'edge'

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const notionDatabaseId = searchParams.get('notionDatabaseId')
  if (!notionDatabaseId) {
    return NextResponse.json({ message: 'Notion database ID is required' }, { status: 400 })
  }
  const notionPages = await getNotionDatabase(notionDatabaseId)
  const events = notionPagesToEvents(notionPages.results as PageObjectResponse[])
  const resetDays = await getRestDays({ year: dayjs().year(), week: true })
  const filteredEvents = filterEventsByRestDay(events, resetDays)

  const { error, value: ics } = createEvents(filteredEvents.map(eventToIcsEvent))

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
