const handler = require('../../pages/api/create-purchase-order').default
const { createMockReq, createMockRes } = require('../../test/helpers/httpMocks')

const API_KEY = 'secret-key'
const SUPABASE_URL = 'https://example.supabase.co'
const SERVICE_ROLE = 'service-role-key'

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

describe('POST /api/create-purchase-order', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    process.env.PURCHASE_API_KEY = API_KEY
    process.env.SUPABASE_URL = SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE
    global.fetch = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    delete global.fetch
  })

  it('rejects non-POST methods with 405', async () => {
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
    expect(res.jsonBody).toEqual({ error: 'Method not allowed' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects requests without an api key (401)', async () => {
    const req = createMockReq({ method: 'POST', body: { product_id: 'p1', quantity: 1 } })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toEqual({ error: 'Unauthorized' })
  })

  it('rejects requests with a wrong api key (401)', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': 'wrong' },
      body: { product_id: 'p1', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('accepts the api key via the Authorization Bearer header', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ id: 'po1' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 'mv1' }]))
    const req = createMockReq({
      method: 'POST',
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { product_id: 'p1', quantity: 2 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it.each([
    ['missing product_id', { quantity: 1 }],
    ['missing quantity', { product_id: 'p1' }],
    ['zero quantity', { product_id: 'p1', quantity: 0 }],
    ['negative quantity', { product_id: 'p1', quantity: -3 }],
  ])('returns 400 for invalid body: %s', async (_label, body) => {
    const req = createMockReq({ method: 'POST', headers: { 'x-api-key': API_KEY }, body })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.jsonBody).toEqual({
      error: 'product_id and positive quantity are required',
    })
  })

  it('returns 500 when supabase configuration is missing', async () => {
    delete process.env.SUPABASE_URL
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p1', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'Supabase configuration missing on server' })
  })

  it('creates a purchase order and records an inventory movement', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ id: 'po-123' }])) // purchase_orders insert
      .mockResolvedValueOnce(jsonResponse([{ id: 'mv-1' }])) // inventory_movements insert

    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p1', quantity: '5', supplier_id: 's1', total_cost: '99.5' },
    })
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual({ ok: true, purchase_order: { id: 'po-123' } })

    // First call inserts the purchase order with coerced numbers.
    const [poUrl, poOpts] = global.fetch.mock.calls[0]
    expect(poUrl).toBe(`${SUPABASE_URL}/rest/v1/purchase_orders`)
    const poBody = JSON.parse(poOpts.body)
    expect(poBody).toMatchObject({
      supplier_id: 's1',
      product_id: 'p1',
      quantity: 5,
      status: 'requested',
      shipping_status: 'pending',
      total_cost: 99.5,
    })
    expect(poOpts.headers.Authorization).toBe(`Bearer ${SERVICE_ROLE}`)

    // Second call records the inventory movement referencing the PO id.
    const [mvUrl, mvOpts] = global.fetch.mock.calls[1]
    expect(mvUrl).toBe(`${SUPABASE_URL}/rest/v1/inventory_movements`)
    const mvBody = JSON.parse(mvOpts.body)
    expect(mvBody).toMatchObject({
      product_id: 'p1',
      movement_type: 'reorder',
      quantity: 5,
      related_order_id: 'po-123',
    })
  })

  it('defaults supplier_id to null and total_cost to 0 when omitted', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ id: 'po-9' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 'mv-9' }]))
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p2', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    const poBody = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(poBody.supplier_id).toBeNull()
    expect(poBody.total_cost).toBe(0)
  })

  it('returns 502 when the purchase order insert fails', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse('db down', false))
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p1', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(502)
    expect(res.jsonBody).toEqual({ error: 'Supabase insert failed', detail: 'db down' })
  })

  it('still succeeds when the inventory movement insert rejects', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ id: 'po-7' }]))
      .mockRejectedValueOnce(new Error('network'))
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p1', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.jsonBody.ok).toBe(true)
  })

  it('returns 500 on unexpected errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('boom'))
    const req = createMockReq({
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: { product_id: 'p1', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody.error).toBe('internal_error')
  })
})
