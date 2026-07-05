// Minimal Next.js API req/res mocks for unit-testing handlers.

function createMockReq({ method = 'GET', body = undefined, headers = {} } = {}) {
  return {
    method,
    body,
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    ),
  }
}

function createMockRes() {
  const res = {
    statusCode: null,
    jsonBody: undefined,
    endBody: undefined,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.jsonBody = payload
      return this
    },
    end(payload) {
      this.endBody = payload
      return this
    },
    setHeader(key, value) {
      this.headers[key] = value
      return this
    },
  }
  return res
}

module.exports = { createMockReq, createMockRes }
