const handler = require('../../pages/api/admin-create-purchase-order').default
const { createMockReq, createMockRes } = require('../../test/helpers/httpMocks')

const ADMIN_PASSWORD = 'letmein'
const SUPABASE_URL = 'https://example.supabase.co'
const SERVICE_ROLE = 'service-role-key'

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

function validBody(overrides = {}) {
  return {
    admin_password: ADMIN_PASSWORD,
    product_id: 'p1',
    quantity: 3,
    supplier_id: 's1',
    total_cost: 50,
    ...overrides,
  }
}

describe('POST /api/admin-create-purchase-order', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD
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
    const req = createMockReq({ method: 'PUT' })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
    expect(res.jsonBody).toEqual({ error: 'Method not allowed' })
  })

  it('returns 401 when the password is missing', async () => {
    const req = createMockReq({ method: 'POST', body: { product_id: 'p1', quantity: 1 } })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toEqual({ error: 'Password required' })
  })

  it('returns 401 when the password is wrong', async () => {
    const req = createMockReq({ method: 'POST', body: validBody({ admin_password: 'nope' }) })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toEqual({ error: 'Invalid password' })
  })

  it('handles a missing/empty request body without throwing (401)', async () => {
    const req = createMockReq({ method: 'POST', body: undefined })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toEqual({ error: 'Password required' })
  })

  it.each([
    ['missing product_id', { product_id: undefined }],
    ['missing quantity', { quantity: undefined }],
    ['zero quantity', { quantity: 0 }],
    ['negative quantity', { quantity: -1 }],
  ])('returns 400 for invalid body: %s', async (_label, overrides) => {
    const req = createMockReq({ method: 'POST', body: validBody(overrides) })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.jsonBody).toEqual({
      error: 'product_id and positive quantity are required',
    })
  })

  it('returns 500 when supabase configuration is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const req = createMockReq({ method: 'POST', body: validBody() })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody).toEqual({ error: 'Supabase configuration missing on server' })
  })

  it('creates a purchase order and returns it', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse([{ id: 'po-1', product_id: 'p1' }]))
    const req = createMockReq({
      method: 'POST',
      body: validBody({ quantity: '4', total_cost: '20' }),
    })
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual({ ok: true, purchase_order: { id: 'po-1', product_id: 'p1' } })

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe(`${SUPABASE_URL}/rest/v1/purchase_orders`)
    const body = JSON.parse(opts.body)
    expect(body).toMatchObject({
      supplier_id: 's1',
      product_id: 'p1',
      quantity: 4,
      status: 'requested',
      shipping_status: 'pending',
      total_cost: 20,
    })
    expect(opts.headers.apikey).toBe(SERVICE_ROLE)
  })

  it('returns the object directly when supabase does not return an array', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({ id: 'po-single' }))
    const req = createMockReq({ method: 'POST', body: validBody() })
    const res = createMockRes()
    await handler(req, res)
    expect(res.jsonBody).toEqual({ ok: true, purchase_order: { id: 'po-single' } })
  })

  it('defaults supplier_id to null and total_cost to 0 when omitted', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse([{ id: 'po-2' }]))
    const req = createMockReq({
      method: 'POST',
      body: { admin_password: ADMIN_PASSWORD, product_id: 'p9', quantity: 1 },
    })
    const res = createMockRes()
    await handler(req, res)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.supplier_id).toBeNull()
    expect(body.total_cost).toBe(0)
  })

  it('returns 502 when the insert fails', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse('insert error', false))
    const req = createMockReq({ method: 'POST', body: validBody() })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(502)
    expect(res.jsonBody).toEqual({ error: 'Failed to create purchase order', detail: 'insert error' })
  })

  it('returns 500 on unexpected errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('boom'))
    const req = createMockReq({ method: 'POST', body: validBody() })
    const res = createMockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
    expect(res.jsonBody.error).toBe('internal_error')
  })
})
