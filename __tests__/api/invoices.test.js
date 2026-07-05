const handler = require('../../pages/api/invoices').default
const mock = require('../../test/mocks/supabaseServer')
const { createMockReq, createMockRes } = require('../../test/helpers/httpMocks')

describe('/api/invoices', () => {
  beforeEach(() => mock.__reset())

  it('GET returns invoices with nested items and selects invoice_items', async () => {
    const rows = [{ id: 'inv1', invoice_items: [{ id: 'it1' }] }]
    mock.__setResult({ data: rows, error: null })
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual(rows)
    const state = mock.__getState()
    expect(state.lastTable).toBe('invoices')
    expect(state.lastSelect).toEqual(['*, invoice_items(*)'])
  })

  it('GET returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'boom' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'boom' })
  })

  it('POST inserts the whole invoice body and returns 201', async () => {
    const invoice = { customer_id: 'c1', total: 100 }
    const created = { id: 'inv2', ...invoice }
    mock.__setResult({ data: [created], error: null })
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: invoice }), res)
    expect(res.statusCode).toBe(201)
    expect(res.jsonBody).toEqual(created)
    expect(mock.__getState().lastInsert).toEqual([invoice])
  })

  it('POST returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'insert failed' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: {} }), res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'insert failed' })
  })

  it('rejects unsupported methods with 405', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'DELETE' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toEqual(['GET', 'POST'])
  })
})
