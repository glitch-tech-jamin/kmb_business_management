import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../src/lib/supabaseServer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const invoice = req.body
      if (!invoice || typeof invoice !== 'object') return res.status(400).json({ error: 'invoice body is required' })
      // Basic insert: invoices and invoice_items (transaction)
      const { data: invoiceData, error: invErr } = await supabaseAdmin.from('invoices').insert([invoice]).select()
      if (invErr) return res.status(500).json({ error: invErr.message })
      return res.status(201).json(invoiceData?.[0])
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (err) {
    console.error('invoices handler failed', err)
    return res.status(500).json({ error: 'internal_error', detail: err instanceof Error ? err.message : String(err) })
  }
}
