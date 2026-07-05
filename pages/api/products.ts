import { createCrudHandler } from '../../src/lib/apiHandler'

export default createCrudHandler({
  table: 'products',
  getInsertPayload: (body) => ({
    name: body.name,
    description: body.description,
    price: body.price,
  }),
})
