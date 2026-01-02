import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

// Suppress console.error in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

vi.mock('fs', () => ({
  default: {
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}))

import fs from 'fs'

describe('GET /api/admin/contests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of contests', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'example.json',
      'test.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (String(filePath).includes('example.json')) {
        return JSON.stringify({
          name: 'Example Contest',
          description: 'A sample contest',
          questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
        })
      }
      if (String(filePath).includes('test.json')) {
        return JSON.stringify({
          name: 'Test Contest',
          questions: [{ id: 1 }],
        })
      }
      return '{}'
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.contests).toHaveLength(2)
    expect(data.contests[0]).toEqual({
      id: 'example',
      name: 'Example Contest',
      description: 'A sample contest',
      questionCount: 3,
    })
    expect(data.contests[1]).toEqual({
      id: 'test',
      name: 'Test Contest',
      description: undefined,
      questionCount: 1,
    })
  })

  it('should filter only .json files', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'contest.json',
      'readme.md',
      'notes.txt',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ name: 'Contest', questions: [] })
    )

    const response = await GET()
    const data = await response.json()

    expect(data.contests).toHaveLength(1)
    expect(data.contests[0].id).toBe('contest')
  })

  it('should use filename as name when name not provided', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'mycontest.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ questions: [{ id: 1 }] })
    )

    const response = await GET()
    const data = await response.json()

    expect(data.contests[0].name).toBe('mycontest')
  })

  it('should return 0 questionCount when questions missing', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'empty.json',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ name: 'Empty' })
    )

    const response = await GET()
    const data = await response.json()

    expect(data.contests[0].questionCount).toBe(0)
  })

  it('should return empty array when no contests', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>)

    const response = await GET()
    const data = await response.json()

    expect(data.contests).toEqual([])
  })

  it('should return 500 on error', async () => {
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error('Directory not found')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to list contests')
  })
})
