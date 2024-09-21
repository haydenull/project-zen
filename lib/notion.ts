import type { PageObjectResponse, TextRichTextItemResponse } from '@notionhq/client/build/src/api-endpoints'

type NotionProperty = PageObjectResponse['properties'][string]
type NotionPropertyType = NotionProperty['type']

type DateResponse = {
  start: string
  end: string | null
}
type PartialSelectResponse = {
  id: string
  name: string
}
export function getPropertyValue(property: NotionProperty, type: 'title'): string | null
export function getPropertyValue(property: NotionProperty, type: 'url'): string | null
export function getPropertyValue(property: NotionProperty, type: 'date'): DateResponse | null
export function getPropertyValue(property: NotionProperty, type: 'select'): PartialSelectResponse | null
export function getPropertyValue(property: NotionProperty, type: 'multi_select'): PartialSelectResponse[] | null
export function getPropertyValue(property: NotionProperty, type: NotionPropertyType): unknown {
  if (property.type !== type) {
    return null
  }

  switch (type) {
    case 'title':
      return (property as { title: TextRichTextItemResponse[] }).title[0].plain_text
    case 'url':
      return (property as { url: string }).url
    case 'date':
      return (property as { date: DateResponse }).date
    case 'select':
      return (property as { select: PartialSelectResponse }).select
    case 'multi_select':
      return (property as { multi_select: PartialSelectResponse[] }).multi_select
    default:
      return null
  }
}
