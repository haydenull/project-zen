import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { env } from '@/env'
import { filterEventsByRestDay, notionPagesToEvents } from '@/lib/event'
import { queries } from '@/services/queries'

const useEvents = () => {
  const { data } = useQuery(queries.notionPages.byDatabaseId(env.NEXT_PUBLIC_NOTION_DATABASE_ID))
  const events = notionPagesToEvents(data?.results as PageObjectResponse[])

  const { data: restDays = [] } = useQuery(queries.holidays.restDaysByYear(dayjs().year()))

  return filterEventsByRestDay(events, restDays)
}

export default useEvents
