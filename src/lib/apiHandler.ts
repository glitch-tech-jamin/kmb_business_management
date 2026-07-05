import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from './supabaseServer'

interface CrudHandlerOptions {
  table: string
  selectQuery?: string
  allowedMethods?: string[]
  getInsertPayload?: (body: Record<string, unknown>) => Record<string, unknown>
}

export function createCrudHandler(options: CrudHandlerOptions) {
  const {
    table,
    selectQuery = '*',
    allowedMethods = ['GET', 'POST'],
    getInsertPayload = (body) => body,
  } = options

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET' && allowedMethods.includes('GET')) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select(selectQuery)
        .order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    }

    if (req.method === 'POST' && allowedMethods.includes('POST')) {
      const payload = getInsertPayload(req.body)
      const { data, error } = await supabaseAdmin
        .from(table)
        .insert([payload])
        .select()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json(data?.[0])
    }

    res.setHeader('Allow', allowedMethods)
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
