// Manual mock for src/lib/supabaseServer used by the .ts API routes.
// The real module is not present in the repo, so tests wire it through
// jest's moduleNameMapper to this controllable chainable query builder.

const state = {
  // Result returned by the terminal awaited call in each handler.
  result: { data: null, error: null },
  // Records the last table / operation for assertions.
  lastTable: null,
  lastInsert: null,
  lastSelect: null,
  lastOrder: null,
}

function makeBuilder() {
  // A thenable, chainable builder mimicking @supabase/supabase-js.
  const builder = {
    select(...args) {
      state.lastSelect = args
      return builder
    },
    insert(rows) {
      state.lastInsert = rows
      return builder
    },
    order(column, opts) {
      state.lastOrder = { column, opts }
      return builder
    },
    then(resolve, reject) {
      return Promise.resolve(state.result).then(resolve, reject)
    },
  }
  return builder
}

const supabaseAdmin = {
  from(table) {
    state.lastTable = table
    return makeBuilder()
  },
}

function __setResult(result) {
  state.result = result
}

function __reset() {
  state.result = { data: null, error: null }
  state.lastTable = null
  state.lastInsert = null
  state.lastSelect = null
  state.lastOrder = null
}

function __getState() {
  return state
}

module.exports = { supabaseAdmin, __setResult, __reset, __getState }
