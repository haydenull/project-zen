'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useTheme } from 'next-themes'

import useEvents from '@/hooks/useEvents'
import { transformEventToFullcalendarEvent } from '@/lib/fullcalendar'
import type { Holiday } from '@/lib/ics'
import { cn } from '@/lib/utils'
import { queries } from '@/services/queries'

import s from './calendar.module.scss'

const Calendar = () => {
  const { theme } = useTheme()
  const today = dayjs()

  const { data: holidays } = useQuery(queries.holidays.byYear({ year: today.year(), week: false }))

  const events = useEvents()
  const fullcalendarEvents = events.map(transformEventToFullcalendarEvent)

  return (
    <div
      className={cn('flex-1', s.fullCalendar)}
      style={{
        // @ts-expect-error define fullcalendar css variables
        '--fc-today-bg-color': 'transparent',
        '--fc-border-color': theme === 'dark' ? '#444' : '#e5e5e5',
        '--fc-highlight-color': theme === 'dark' ? 'rgba(188,232,241,.1)' : 'rgba(188,232,241,.3)',
        '--fc-page-bg-color': theme === 'dark' ? '#444' : '#fff',
      }}
    >
      <FullCalendar
        weekNumbers
        weekNumberClassNames="text-xs"
        initialView="dayGridMonth"
        plugins={[dayGridPlugin]}
        dayCellContent={({ date, dayNumberText, isToday }) => (
          <DayNumber date={date} dayNumberText={dayNumberText} isToday={isToday} holidays={holidays} />
        )}
        events={fullcalendarEvents}
      />
    </div>
  )
}

/** 渲染日期单元格的日期 */
function DayNumber({
  date,
  dayNumberText,
  isToday,
  holidays,
}: {
  date: Date
  dayNumberText: string
  isToday: boolean
  holidays?: Record<string, Holiday>
}) {
  const dateString = dayjs(date).format('YYYY-MM-DD')
  const holidayInfo = holidays?.[dateString]

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className={cn(
        'relative mt-0.5 flex size-7 items-center justify-center rounded-full',
        isToday && 'bg-red-500 text-white',
      )}
    >
      {children}
    </div>
  )

  if (holidayInfo) {
    const tip = holidayInfo.holiday ? '休' : '班'
    return (
      <Wrapper>
        {dayNumberText}
        <span
          className={cn(
            'absolute -right-1 -top-1 text-xs',
            holidayInfo.holiday
              ? 'text-green-600'
              : 'size-4 scale-90 rounded-full bg-green-400 text-center text-green-800',
            {
              'border-2 border-zinc-50': isToday,
            },
          )}
        >
          {tip}
        </span>
      </Wrapper>
    )
  }

  return <Wrapper>{dayNumberText}</Wrapper>
}

export default Calendar
