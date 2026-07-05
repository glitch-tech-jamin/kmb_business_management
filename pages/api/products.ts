import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../src/lib/supabaseServer'
import { authenticateRequest } from '../../src/lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateRequest(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: 'Failed to fetch products' })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, description, price } = req.body ?? {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' })
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be a string' })
    }
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number' })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{ name: name.trim(), description: description?.trim(), price: price ?? 0 }])
      .select()
    if (error) return res.status(500).json({ error: 'Failed to create product' })
    return res.status(201).json(data?.[0])
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
