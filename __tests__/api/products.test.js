const handler = require('../../pages/api/products').default
const mock = require('../../test/mocks/supabaseServer')
const { createMockReq, createMockRes } = require('../../test/helpers/httpMocks')

describe('/api/products', () => {
  beforeEach(() => mock.__reset())

  it('GET returns products ordered by created_at', async () => {
    const rows = [{ id: 'p1', name: 'Widget', price: 9.99 }]
    mock.__setResult({ data: rows, error: null })
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual(rows)
    expect(mock.__getState().lastTable).toBe('products')
  })

  it('GET returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'boom' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'boom' })
  })

  it('POST inserts only name/description/price and returns 201', async () => {
    const created = { id: 'p2', name: 'Gadget', description: 'd', price: 5 }
    mock.__setResult({ data: [created], error: null })
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Gadget', description: 'd', price: 5, ignored: 'x' },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.jsonBody).toEqual(created)
    expect(mock.__getState().lastInsert).toEqual([
      { name: 'Gadget', description: 'd', price: 5 },
    ])
  })

  it('POST returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'insert failed' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(500)
  })

  it('rejects unsupported methods with 405', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'PATCH' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toEqual(['GET', 'POST'])
  })
})
