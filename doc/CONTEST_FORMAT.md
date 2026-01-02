# Contest Format Guide

This guide explains how to create custom question sets for Golden Friends.

## File Location

Contest files are stored in `src/data/contests/` as JSON files.

```
src/data/contests/
├── example.json        # Sample questions
├── newyeareve2025.json # Custom party questions
└── your-contest.json   # Add your own!
```

## JSON Structure

```json
{
  "name": "My Contest",
  "description": "Optional description of this question set",
  "questions": [
    // Question objects go here
  ]
}
```

## Question Types

### Multiple Choice (Classic Family Feud)

Survey-style questions with ranked answers.

```json
{
  "id": 1,
  "type": "multiple",
  "category": "Food",
  "question": "Name something you put on a hamburger",
  "pointMultiplier": 1,
  "answers": [
    { "id": 1, "text": "Ketchup", "points": 35, "revealed": false },
    { "id": 2, "text": "Cheese", "points": 25, "revealed": false },
    { "id": 3, "text": "Lettuce", "points": 20, "revealed": false },
    { "id": 4, "text": "Pickles", "points": 12, "revealed": false },
    { "id": 5, "text": "Onions", "points": 8, "revealed": false }
  ]
}
```

### Buzzer Question (Quick-Fire)

Single correct answer, players race to buzz.

```json
{
  "id": 3,
  "type": "buzzer",
  "category": "Geography",
  "question": "What is the capital of France?",
  "correctAnswer": "Paris",
  "pointMultiplier": 1
}
```

### Photo Question

Buzzer question with an image displayed.

```json
{
  "id": 4,
  "type": "buzzer",
  "category": "Photo Round",
  "question": "Who sent this photo?",
  "correctAnswer": "Marie",
  "mediaUrl": "/data/photos/beach.jpg",
  "pointMultiplier": 2
}
```

Place images in `public/data/` directory.

### Timed Question

Add a time limit for extra pressure.

```json
{
  "id": 5,
  "type": "buzzer",
  "category": "Speed Round",
  "question": "Name a country in Europe",
  "correctAnswer": "France",
  "timeLimit": 10,
  "pointMultiplier": 2
}
```

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique question identifier |
| `type` | string | `"multiple"` or `"buzzer"` |
| `question` | string | The question text |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | - | Question category/theme |
| `pointMultiplier` | number | 1 | Score multiplier (1, 2, or 3) |
| `answers` | array | - | Required for `multiple` type |
| `correctAnswer` | string | - | Required for `buzzer` type |
| `mediaUrl` | string | - | Path to image file |
| `timeLimit` | number | - | Timer duration in seconds |

### Answer Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique answer identifier |
| `text` | string | Answer text displayed |
| `points` | number | Points awarded |
| `revealed` | boolean | Always set to `false` |

## Scoring Guidelines

### Multiple Choice Points

Total points should roughly sum to 100:

| Rank | Suggested Points |
|------|-----------------|
| #1 Answer | 35-50 |
| #2 Answer | 20-30 |
| #3 Answer | 15-20 |
| #4 Answer | 10-15 |
| #5 Answer | 5-10 |

### Point Multipliers

Use multipliers to increase stakes in later rounds:

| Round | Multiplier | Effective Total |
|-------|------------|-----------------|
| 1-2 | 1x | ~100 points |
| 3-4 | 2x | ~200 points |
| 5+ | 3x | ~300 points |

## Example: Complete Contest

```json
{
  "name": "Birthday Party 2025",
  "description": "Questions about the birthday person",
  "questions": [
    {
      "id": 1,
      "type": "multiple",
      "category": "Favorites",
      "question": "Name Alex's favorite food",
      "pointMultiplier": 1,
      "answers": [
        { "id": 1, "text": "Pizza", "points": 40, "revealed": false },
        { "id": 2, "text": "Sushi", "points": 30, "revealed": false },
        { "id": 3, "text": "Tacos", "points": 20, "revealed": false },
        { "id": 4, "text": "Burgers", "points": 10, "revealed": false }
      ]
    },
    {
      "id": 2,
      "type": "buzzer",
      "category": "Trivia",
      "question": "What year did Alex graduate?",
      "correctAnswer": "2018",
      "pointMultiplier": 1
    },
    {
      "id": 3,
      "type": "buzzer",
      "category": "Photos",
      "question": "Where was this vacation photo taken?",
      "correctAnswer": "Barcelona",
      "mediaUrl": "/data/photos/vacation.jpg",
      "pointMultiplier": 2
    }
  ]
}
```

## Tips for Good Questions

1. **Balance Difficulty**: Mix easy and hard questions
2. **Know Your Audience**: Personalize for your group
3. **Test Answer Ranking**: Survey friends beforehand
4. **Variety**: Alternate between multiple and buzzer types
5. **Build Excitement**: Save best questions for higher multipliers
6. **Keep It Fair**: Both teams should have equal chances

## Adding Photos

1. Create `public/data/photos/` directory (gitignored by default)
2. Add images (JPG, PNG, etc.)
3. Reference with `/data/photos/filename.jpg`

Photos are not committed to git for privacy reasons.
