# Golden Friends

A Family Feud-style party game built with Next.js and Socket.io. Features a TV display, admin panel, and mobile buzzers for players.

I created this game for the New Year Eve 2025 party, see the questions in src/data/contests.

## Screenshots

### Landing Page
The home screen where players can access the TV display, admin panel, or join as a player via buzzer.

![Landing Page](docs/screenshots/01-landing-page.png)

### TV Display (Lobby)
The TV screen shown while waiting for players to join. Shows team counts and a QR code for easy joining.

![TV Lobby](docs/screenshots/02-tv-lobby.png)

### TV Display (Host Mode)
Press 'H' on the TV display to show host prompts at the bottom of the screen.

![TV Host Mode](docs/screenshots/03-tv-host-mode.png)

### Admin Panel
The game host controls everything from here: select contests, navigate questions, reveal answers, manage scores, and control game phases.

![Admin Panel](docs/screenshots/04-admin-panel.png)

### Mobile Buzzer
Players join on their phones by entering their name and selecting a team (Girls or Boys).

![Buzzer Team Selection](docs/screenshots/05-buzzer-team-selection.png)

![Buzzer With Name](docs/screenshots/06-buzzer-with-name.png)

## Endpoints

- `/` - Home page with QR code for players
- `/tv` - TV display for the game (show on large screen)
- `/admin` - Admin panel to control the game (password protected)
- `/buzzer` - Mobile buzzer for players

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and customize
cp .env.example .env.local

# Start the server (includes Next.js + Socket.IO)
npm run dev:server

# Open in browser:
# - Landing: http://localhost:3000
# - TV Display: http://localhost:3000/tv
# - Admin: http://localhost:3000/admin (default password: golden2025)
```

## Documentation

Detailed documentation is available in the `doc/` directory:

- [API Reference](doc/API.md) - REST endpoints and Socket.IO events
- [Architecture](doc/ARCHITECTURE.md) - System design and data flow
- [Game Rules](doc/GAME_RULES.md) - How to play the game
- [Admin Guide](doc/ADMIN_GUIDE.md) - Running a game session
- [Contest Format](doc/CONTEST_FORMAT.md) - Creating custom questions

## Development

```bash
# Next.js dev server (no Socket.IO)
npm run dev

# Full server with Socket.IO (recommended)
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

## Environment Variables

See `.env.example` for available configuration options:

- `ADMIN_PASSWORD` - Admin panel password (default: golden2025)
- `PORT` - Server port (default: 3000)
