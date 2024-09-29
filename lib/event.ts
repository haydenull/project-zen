import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import dayjs, { type Dayjs } from 'dayjs'

import { NOTION_PAGE_PROPERTIES } from './constants'
import { getPropertyValue } from './notion'

export type Project = {
  id: string
  name: string
  url: string
}
export type Event = {
  id: string
  start: Dayjs
  end?: Dayjs
  project: Project
  title: string
  description?: string
}

const genEventFromNotionPage = (
  properties: PageObjectResponse['properties'],
  propertyKey: string,
  title: string,
  project: Project,
): Event | null => {
  const dateProperty = properties[propertyKey]
  const date = getPropertyValue(dateProperty, 'date')
  if (!date) return null
  const start = dayjs(date.start)
  return {
    id: `${project.id}_${title}`,
    start,
    end: date.end ? dayjs(date.end) : undefined,
    title: `${title} [${project.name}]`,
    project,
  }
}
/** 将 notion page 转换为 event */
export const notionPagesToEvents = (notionPages: PageObjectResponse[] = []): Event[] => {
  return notionPages
    .map((page) => {
      const properties = page.properties
      const pageTitle = getPropertyValue(properties.Name, 'title') || ''
      const project: Project = {
        id: page.parent.type === 'database_id' ? page.parent.database_id : page.id,
        name: pageTitle,
        url: page.url,
      }
      return [
        genEventFromNotionPage(properties, NOTION_PAGE_PROPERTIES.dateDevelopment, '开发', project),
        genEventFromNotionPage(properties, NOTION_PAGE_PROPERTIES.dateIntegration, '联调', project),
        genEventFromNotionPage(properties, NOTION_PAGE_PROPERTIES.dateShowcase, '🚩Showcase', project),
        genEventFromNotionPage(properties, NOTION_PAGE_PROPERTIES.dateTest, '测试', project),
        genEventFromNotionPage(properties, NOTION_PAGE_PROPERTIES.dateRelease, '🚩上线', project),
      ].filter(Boolean)
    })
    .flat()
}

/**
 * 过滤休息日
 * 如果一个 event 跨越休息日，则需要将节假日从 event 中移除
 * eg:  假如 event 为 [2024-06-01 ~ 2024-06-10], 而 2024-06-08 为节假日, 则需要将 event 分割为 [2024-06-01 ~ 2024-06-07] 和 [2024-06-09 ~ 2024-06-10]
 */
export const filterEventsByRestDay = (events: Event[], restDays: Dayjs[]) => {
  return events
    .map((event) => {
      const { start, end } = event

      // 单天
      if (!end || start.isSame(end, 'day')) {
        const isRestDay = restDays.some((restDay) => start.isSame(restDay, 'day'))
        if (isRestDay) return null
        return event
      }

      // 跨天
      const workDays = new Array(end.diff(start, 'day') + 1)
        .fill(0)
        .map((_, i) => start.add(i, 'day'))
        .filter((day) => !restDays.some((restDay) => restDay.isSame(day, 'day')))

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
        const start = days[0]
        const end = days[days.length - 1]
        const { title, ...rest } = event
        return {
          ...rest,
          title: `${title} ${index + 1}`,
          start,
          end: days.length > 1 ? end : undefined,
        }
      })
    })
    .filter(Boolean)
    .flat()
}
