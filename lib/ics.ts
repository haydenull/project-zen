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
    end: date.end ? genIcsDateArray(dayjs(date.end)) : start,
  }
}

/** 将 notion page 转换为 ics 文件 */
export const notionPagesToIcs = async (notionPages: PageObjectResponse[]) => {
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
        description,
      }

      return [
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateDevelopment, '开发', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateIntegration, '联调', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateShowcase, 'Showcase', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateTest, '测试', COMMON_PROPS),
        genIcsEvent(properties, NOTION_PAGE_PROPERTIES.dateRelease, '上线', COMMON_PROPS),
      ].filter(Boolean)
    })
    .flat()
  const { error, value } = createEvents(events)
  return value
}
