import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/verify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/verify', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return success for correct default password', async () => {
    const request = createRequest({ password: 'admin' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 401 for incorrect password', async () => {
    const request = createRequest({ password: 'wrongpassword' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should use ADMIN_PASSWORD env variable when set', async () => {
    process.env.ADMIN_PASSWORD = 'secretpass'

    const request = createRequest({ password: 'secretpass' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject default password when ADMIN_PASSWORD is set', async () => {
    process.env.ADMIN_PASSWORD = 'secretpass'

    const request = createRequest({ password: 'admin' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should return 401 for empty password', async () => {
    const request = createRequest({ password: '' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})
