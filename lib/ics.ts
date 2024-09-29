import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import dayjs, { type Dayjs } from 'dayjs'
import { createEvents, type EventAttributes } from 'ics'

import { NOTION_PAGE_PROPERTIES } from './constants'
import { getPropertyValue } from './notion'

const genIcsDateArray = (day: Dayjs, allDay = true): EventAttributes['start'] => {
  const year = day.year()
  const month = day.month() + 1
  const date = day.date()
  const hour = day.hour()
  const minute = day.minute()
  return allDay ? [year, month, date] : [year, month, date, hour, minute]
}

const genIcsEvent = (
  properties: PageObjectResponse['properties'],
  propertyKey: string,
  title: string,
  commonProps: Partial<EventAttributes>,
): EventAttributes | null => {
  const dateProperty = properties[propertyKey]
  const date = getPropertyValue(dateProperty, 'date')
  if (!date) return null
  const start = genIcsDateArray(dayjs(date.start))
  return {
    ...commonProps,
    title: `${title} [${commonProps.title}]`,
    start,
    end: date.end ? genIcsDateArray(dayjs(date.end).add(1, 'day')) : start,
    // categories: [commonProps.title ?? ''],
  }
}

/** 将 notion page 转换为 ics 事件 */
export const notionPagesToIcsEvents = (notionPages: PageObjectResponse[]): EventAttributes[] => {
  const events: EventAttributes[] = notionPages
    .map((page) => {
      const properties = page.properties
      const pageTitle = getPropertyValue(properties.Name, 'title') || ''
      const description = [
        { label: 'Project', value: pageTitle },
        { label: 'PRD', value: getPropertyValue(properties[NOTION_PAGE_PROPERTIES.docPrd], 'url') },
        { label: 'Jira', value: getPropertyValue(properties[NOTION_PAGE_PROPERTIES.docJira], 'url') },
      ]
        .filter((item) => item.value)
        .map(({ label, value }) => `${label}: ${value}`)
        .join('\n\n')
      const COMMON_PROPS: Partial<EventAttributes> = {
        title: pageTitle,
        calName: 'Project Zen',
        productId: 'project-zen.haydenhayden.com',
        url: page.url,
        description,
      }

      return [
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateDevelopment, '开发', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateIntegration, '联调', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateShowcase, '🚩Showcase', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateTest, '测试', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateRelease, '🚩上线', COMMON_PROPS),
      ].filter(Boolean)
    })
    .flat()
  return events
}

/**
 * 过滤节假日
 * 如果一个 event 跨越节假日，则需要将节假日从 event 中移除
 * eg:  假如 event 为 [2024-06-01 ~ 2024-06-10], 而 2024-06-08 为节假日, 则需要将 event 分割为 [2024-06-01 ~ 2024-06-07] 和 [2024-06-09 ~ 2024-06-10]
 */
export const filterIcsEventsByHoliday = async (events: EventAttributes[], year: number) => {
  const holidays = await getRestDays({ year, week: true })

  const newEvents: EventAttributes[] = events
    .map((event) => {
      const [startYear, startMonth, startDay] = event.start as number[]
      const start = dayjs(`${startYear}-${startMonth}-${startDay}`, 'YYYY-M-D')

      if ('end' in event) {
        const [endYear, endMonth, endDay] = event.end as number[]
        const end = dayjs(`${endYear}-${endMonth}-${endDay}`, 'YYYY-M-D')
        // 单天
        if (start.isSame(end, 'day')) {
          const isHoliday = holidays.some((holiday) => start.isSame(holiday, 'day'))
          if (isHoliday) return null
          return event
        }

        // 跨天
        const workDays = new Array(end.diff(start, 'day') + 1)
          .fill(0)
          .map((_, i) => start.add(i, 'day'))
          .filter((day) => !holidays.some((holiday) => holiday.isSame(day, 'day')))

        // 依据连续性将 workDays 分组
        const workDaysGroups = workDays.reduce((groups, day) => {
          const lastGroup = groups[groups.length - 1]
          if (lastGroup && day.diff(lastGroup[lastGroup.length - 1], 'day') === 1) {
            lastGroup.push(day)
          } else {
            groups.push([day])
          }
          return groups
        }, [] as Dayjs[][])

        return workDaysGroups.map((days, index) => {
          const startDay = days[0]
          const endDay = days[days.length - 1].add(1, 'day')
          const { title, ...rest } = event
          const start = genIcsDateArray(startDay)
          return {
            ...rest,
            title: `${title} ${index + 1}`,
            start,
            end: days.length > 1 ? genIcsDateArray(endDay) : start,
          }
        })
      }
      return null
    })
    .filter(Boolean)
    .flat()
  return newEvents
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
