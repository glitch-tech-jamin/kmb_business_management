import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../src/lib/supabaseServer'
import { authenticateRequest } from '../../src/lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateRequest(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: 'Failed to fetch customers' })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, email, phone, address } = req.body ?? {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' })
    }
    if (email !== undefined && typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' })
    }
    if (phone !== undefined && typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone must be a string' })
    }
    if (address !== undefined && typeof address !== 'string') {
      return res.status(400).json({ error: 'address must be a string' })
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert([{ name: name.trim(), email: email?.trim(), phone: phone?.trim(), address: address?.trim() }])
      .select()
    if (error) return res.status(500).json({ error: 'Failed to create customer' })
    return res.status(201).json(data?.[0])
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
