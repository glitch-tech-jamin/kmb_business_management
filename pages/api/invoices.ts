import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../src/lib/supabaseServer'
import { authenticateRequest } from '../../src/lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateRequest(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: 'Failed to fetch invoices' })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const invoice = req.body ?? {}

    if (!invoice.customer_id || typeof invoice.customer_id !== 'string') {
      return res.status(400).json({ error: 'customer_id is required' })
    }
    if (invoice.total !== undefined && (typeof invoice.total !== 'number' || invoice.total < 0)) {
      return res.status(400).json({ error: 'total must be a non-negative number' })
    }

    const allowedFields = ['customer_id', 'employee_id', 'status', 'total', 'due_date']
    const sanitized: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (invoice[key] !== undefined) sanitized[key] = invoice[key]
    }

    const { data: invoiceData, error: invErr } = await supabaseAdmin.from('invoices').insert([sanitized]).select()
    if (invErr) return res.status(500).json({ error: 'Failed to create invoice' })
    return res.status(201).json(invoiceData?.[0])
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
