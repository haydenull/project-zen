import { createQueryKeyStore } from '@lukemorales/query-key-factory'

import { getHolidays, getRestDays, type GetHolidaysParams } from '@/lib/ics'

import { getNotionDatabase, getUsers } from './actions'

export const queries = createQueryKeyStore({
  users: {
    all: {
      queryKey: null,
      queryFn: () => getUsers(),
    },
  },
  holidays: {
    byYear: ({ year, week }: GetHolidaysParams) => ({
      queryKey: [year, week],
      queryFn: () => getHolidays({ year, week }),
    }),
    restDaysByYear: (year: GetHolidaysParams['year']) => ({
      queryKey: [year],
      queryFn: () => getRestDays({ year, week: true }),
    }),
  },
  notionPages: {
    byDatabaseId: (databaseId: string) => ({
      queryKey: [databaseId],
      queryFn: () => getNotionDatabase(databaseId),
    }),
  },
})
