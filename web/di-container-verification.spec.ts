import { test, expect } from '@playwright/test'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

async function isPortFree(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => server.close(() => resolve(true)))
      .listen(port, '127.0.0.1')
  })
}

async function pickPort(preferred: number): Promise<number> {
  if (await isPortFree(preferred)) return preferred
  if (await isPortFree(preferred + 1)) return preferred + 1
  if (await isPortFree(preferred + 2)) return preferred + 2
  throw new Error(`No free port near ${preferred}`)
}

async function waitForHttpOk(url: string, timeoutMs = 60_000): Promise<void> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

test.describe('DI container verification (backend)', () => {
  let server: ChildProcessWithoutNullStreams | undefined
  let port = 0

  test.beforeAll(async () => {
    port = await pickPort(8783)
    const projectRoot = path.resolve(__dirname, '..')

    server = spawn(
      'python3',
      [
        '-m',
        'uvicorn',
        'src.api.main:app',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--log-level',
        'warning',
      ],
      {
        cwd: projectRoot,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        detached: true,
        stdio: 'pipe',
      }
    )

    await waitForHttpOk(`http://127.0.0.1:${port}/`)
  })

  test.afterAll(async () => {
    if (!server) return
    try {
      if (server.pid) process.kill(-server.pid, 'SIGTERM')
    } catch {
      // ignore
    }
  })

  test('metrics endpoints work via centralized container', async ({ request }) => {
    const summaryRes = await request.get(`http://127.0.0.1:${port}/api/v1/metrics/summary`)
    expect(summaryRes.ok()).toBeTruthy()
    const summary = await summaryRes.json()
    expect(typeof summary.total_calls).toBe('number')
    expect(typeof summary.total_tokens).toBe('number')
    expect(typeof summary.total_cost_usd).toBe('number')
    expect(typeof summary.total_errors).toBe('number')

    const modulesRes = await request.get(`http://127.0.0.1:${port}/api/v1/metrics/modules`)
    expect(modulesRes.ok()).toBeTruthy()
    const modules = await modulesRes.json()
    expect(modules).toBeTruthy()
  })
})
