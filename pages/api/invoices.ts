import { createCrudHandler } from '../../src/lib/apiHandler'

export default createCrudHandler({
  table: 'invoices',
  selectQuery: '*, invoice_items(*)',
})
