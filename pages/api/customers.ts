import { createCrudHandler } from '../../src/lib/apiHandler'

export default createCrudHandler({
  table: 'customers',
  getInsertPayload: (body) => ({
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
  }),
})
