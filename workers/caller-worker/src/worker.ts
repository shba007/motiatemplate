import { registerWorker, Logger } from 'iii-sdk'

const engineUrl = process.env.III_URL ?? 'ws://127.0.0.1:49134'
const worker = registerWorker(engineUrl)
const logger = new Logger()

// ==========================================
// 1. Health Check (Migrated from health.step.ts)
// ==========================================
worker.registerFunction('api::health', async () => {
  return {
    status_code: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      node: process.env.HOSTNAME || 'local-node',
      uptime: process.uptime(),
    },
  }
})

worker.registerTrigger({
  type: 'http',
  function_id: 'api::health',
  config: {
    api_path: '/health',
    http_method: 'GET',
  },
})

// ==========================================
// 2. Math Add Endpoint & Function
// ==========================================
worker.registerFunction('math::add', async (payload: { a: number; b: number }) => {
  logger.info('Executing math::add', payload)
  const { a, b } = payload
  return {
    a,
    b,
    result: a + b,
  }
})

worker.registerFunction('http::add_two_numbers', async (event: { body: { a: number; b: number } }) => {
  const { a, b } = event.body ?? {}
  if (typeof a !== 'number' || typeof b !== 'number') {
    return {
      status_code: 400,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Payload must contain numbers "a" and "b"' },
    }
  }

  // Trigger internal function
  const mathResult = await worker.trigger({
    function_id: 'math::add',
    payload: { a, b },
  })

  return {
    status_code: 200,
    headers: { 'Content-Type': 'application/json' },
    body: mathResult,
  }
})

worker.registerTrigger({
  type: 'http',
  function_id: 'http::add_two_numbers',
  config: {
    api_path: '/math/add',
    http_method: 'POST',
  },
})

console.log(`Caller worker connected to iii engine at ${engineUrl}`)
