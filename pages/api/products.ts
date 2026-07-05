import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../src/lib/supabaseServer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const { name, description, price } = req.body ?? {}
      if (!name) return res.status(400).json({ error: 'name is required' })
      const { data, error } = await supabaseAdmin.from('products').insert([{ name, description, price }]).select()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json(data?.[0])
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (err) {
    console.error('products handler failed', err)
    return res.status(500).json({ error: 'internal_error', detail: err instanceof Error ? err.message : String(err) })
  }
}
