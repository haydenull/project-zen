import dayjs, { type Dayjs } from 'dayjs'
import { type EventAttributes } from 'ics'

import type { Event } from './event'

const genIcsDateArray = (day: Dayjs, allDay = true): EventAttributes['start'] => {
  const year = day.year()
  const month = day.month() + 1
  const date = day.date()
  const hour = day.hour()
  const minute = day.minute()
  return allDay ? [year, month, date] : [year, month, date, hour, minute]
}

/** 将 Event 转为 ics Event */
export const eventToIcsEvent = (event: Event): EventAttributes => {
  const { title, start, end, project, extra = {} } = event
  const startDate = genIcsDateArray(dayjs(start))
  const description = [
    { label: 'Project', value: project.name },
    { label: 'PRD', value: extra.prd },
    { label: 'Jira', value: extra.jira },
  ]
    .filter((item) => Boolean(item.value))
    .map(({ label, value }) => `${label}: ${value}`)
    .join('\n\n')

  return {
    title,
    calName: 'Project Zen',
    productId: 'project-zen.haydenhayden.com',
    url: project.url,
    description,
    start: startDate,
    end: end ? genIcsDateArray(dayjs(end).add(1, 'day')) : startDate,
  }
}

/** 获取节假日中的休息日
 * https://timor.tech/api/holiday/
 */
export const getRestDays = async ({ year, week }: GetHolidaysParams) => {
  const data = await getHolidays({ year, week })
  return Object.entries(data)
    .map(([dateString, { holiday }]) => {
      if (holiday) {
        return dayjs(dateString)
      }
      return null
    })
    .filter(Boolean)
}

export type GetHolidaysParams = {
  year: number
  /** 是否包含周末 */
  week: boolean
}
export type Holiday = {
  holiday: boolean
  name: string
  wage: number
}
/**
 * 获取节假日相关的日期（包含休息日与调休工作日）
 * https://timor.tech/api/holiday/
 */
export const getHolidays = async ({ year, week }: GetHolidaysParams) => {
  const result = await fetch(`https://timor.tech/api/holiday/year/${year}?week=${week ? 'Y' : 'N'}`)
  const data = (await result.json()) as {
    code: number
    holiday: Record<string, Holiday>
  }
  // 给每个日期key拼接上年份
  const holidaysWithYear = Object.entries(data.holiday).reduce(
    (acc, [dateString, value]) => {
      const dateWithYear = `${year}-${dateString}`
      acc[dateWithYear] = value
      return acc
    },
    {} as typeof data.holiday,
  )

  return holidaysWithYear
}
