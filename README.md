# Golden Friends

A Family Feud-style party game built with Next.js and Socket.io. Features a TV display, admin panel, and mobile buzzers for players.

I created this game for the New Year Eve 2025 party, see the questions in src/data/contests.

## Endpoints

- `/` - Home page
- `/tv` - TV display for the game
- `/admin` - Admin panel to control the game
- `/buzzer` - Mobile buzzer for players

## Setup

```bash
npm install
```

## Development

```bash
# Terminal 1: Next.js frontend
npm run dev

# Terminal 2: Socket.io server
npm run dev:server
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Production

```bash
npm run build
npm start
```
