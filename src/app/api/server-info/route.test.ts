import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

describe('GET /api/server-info', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return default localhost and port 3000', async () => {
    delete process.env.LOCAL_IP
    delete process.env.PORT

    const response = await GET()
    const data = await response.json()

    expect(data.ip).toBe('localhost')
    expect(data.port).toBe('3000')
  })

  it('should return LOCAL_IP from env when set', async () => {
    process.env.LOCAL_IP = '192.168.1.100'

    const response = await GET()
    const data = await response.json()

    expect(data.ip).toBe('192.168.1.100')
  })

  it('should return PORT from env when set', async () => {
    process.env.PORT = '8080'

    const response = await GET()
    const data = await response.json()

    expect(data.port).toBe('8080')
  })

  it('should return both custom IP and port', async () => {
    process.env.LOCAL_IP = '10.0.0.5'
    process.env.PORT = '4000'

    const response = await GET()
    const data = await response.json()

    expect(data.ip).toBe('10.0.0.5')
    expect(data.port).toBe('4000')
  })
})
