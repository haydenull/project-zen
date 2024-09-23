'use server'

// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
import { Client } from '@notionhq/client'

import { db } from '@/db'
import { env } from '@/env'

const notion = new Client({
  auth: env.NOTION_INTEGRATION_TOKEN,
})

/** get users */
export const getUsers = async () => {
  const users = await db.query.usersTable.findMany()
  return users
}

export const getNotionDatabase = async (notionDatabaseId: string) => {
  const database = await notion.databases.query({ database_id: notionDatabaseId })
  return database
}
