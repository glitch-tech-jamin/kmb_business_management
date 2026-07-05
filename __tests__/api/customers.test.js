const handler = require('../../pages/api/customers').default
const mock = require('../../test/mocks/supabaseServer')
const { createMockReq, createMockRes } = require('../../test/helpers/httpMocks')

describe('/api/customers', () => {
  beforeEach(() => mock.__reset())

  it('GET returns customers ordered by created_at', async () => {
    const rows = [{ id: 'c1', name: 'Acme' }]
    mock.__setResult({ data: rows, error: null })
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual(rows)
    const state = mock.__getState()
    expect(state.lastTable).toBe('customers')
    expect(state.lastOrder).toEqual({ column: 'created_at', opts: { ascending: false } })
  })

  it('GET returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'boom' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'boom' })
  })

  it('POST inserts a customer and returns 201 with the created row', async () => {
    const created = { id: 'c2', name: 'Beta', email: 'b@x.com' }
    mock.__setResult({ data: [created], error: null })
    const req = createMockReq({
      method: 'POST',
      body: { name: 'Beta', email: 'b@x.com', phone: '123', address: 'St' },
    })
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.jsonBody).toEqual(created)
    const state = mock.__getState()
    expect(state.lastTable).toBe('customers')
    expect(state.lastInsert).toEqual([
      { name: 'Beta', email: 'b@x.com', phone: '123', address: 'St' },
    ])
  })

  it('POST returns 500 on error', async () => {
    mock.__setResult({ data: null, error: { message: 'insert failed' } })
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { name: 'x' } }), res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'insert failed' })
  })

  it('rejects unsupported methods with 405 and an Allow header', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'DELETE' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toEqual(['GET', 'POST'])
    expect(res.endBody).toBe('Method DELETE Not Allowed')
  })
})
