import type { Event } from './event'

// https://fullcalendar.io/docs/event-object
export type FullcalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  extendedProps: Event
  allDay: boolean
  // rrule?: RRule
  editable?: boolean
  color?: string
  textColor?: string
  duration?: { minute: number } // rrule event duration
}

export const transformEventToFullcalendarEvent = (event: Event): FullcalendarEvent => {
  const { id, start, end, title, project } = event
  return {
    id,
    start: start.toDate(),
    end: end ? end.add(1, 'day').toDate() : start.add(1, 'day').toDate(),
    title: title,
    extendedProps: event,
    allDay: true,
  }
}
