import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface ContestInfo {
  id: string
  name: string
  description?: string
  questionCount: number
}

export async function GET() {
  const contestsDir = path.join(process.cwd(), 'src/data/contests')

  try {
    const files = fs.readdirSync(contestsDir).filter((f) => f.endsWith('.json'))

    const contests: ContestInfo[] = files.map((filename) => {
      const filePath = path.join(contestsDir, filename)
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      return {
        id: filename.replace('.json', ''),
        name: content.name || filename.replace('.json', ''),
        description: content.description,
        questionCount: content.questions?.length || 0,
      }
    })

    return NextResponse.json({ contests })
  } catch (error) {
    console.error('Failed to list contests:', error)
    return NextResponse.json({ error: 'Failed to list contests' }, { status: 500 })
  }
}
