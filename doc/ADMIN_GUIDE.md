# Admin Guide

This guide explains how to control the game using the admin panel at `/admin`.

## Authentication

The admin panel is password protected.

- **Default password**: `golden2025`
- **Custom password**: Set `ADMIN_PASSWORD` environment variable
- Session persists in browser until closed

## Admin Panel Layout

The panel is organized in sections:

1. **Contest Selector** - Top bar to switch question sets
2. **Question Navigator** - List of all questions with navigation
3. **Phase Controls** - Manage game phases
4. **Buzzer Monitor** - See who buzzed and in what order
5. **Answer Board** - Reveal/hide answers
6. **Score Controls** - Adjust team scores
7. **Player List** - Connected players by team

## Running a Game

### Pre-Game Setup

1. Start the server: `npm run dev:server`
2. Open admin panel: `http://localhost:3000/admin`
3. Enter password
4. Select contest from dropdown (or use default)
5. Open TV display on large screen: `http://localhost:3000/tv`
6. Have players scan QR code from landing page

### Starting a Round

1. **Select Question**: Use navigator or Next/Prev buttons
2. **Set Phase to Face-Off**: Click "Face-Off" button
3. **Show Question**: Click "Show Question" to reveal on TV
4. **Unlock Buzzers**: Click "Unlock Buzzers" when ready

### During Face-Off

1. Wait for players to buzz
2. First buzzer is shown in the Buzzer Monitor
3. Click team button to give them control, OR
4. Mark answer correct/wrong for buzzer questions

### During Play Phase

1. Team members guess answers verbally
2. Click answer button to reveal correct guesses
3. Click "Add Strike" for wrong guesses
4. Watch for 3 strikes (auto-triggers steal phase)

### Handling Steals

1. Opposing team gets one guess
2. If correct: Click their team to award all points
3. If wrong: Click original team to award points

### Ending a Round

1. Click "Reveal All" to show remaining answers
2. Award points to winning team
3. Click "Next" to proceed

## Control Reference

### Phase Buttons

| Button | Action |
|--------|--------|
| Lobby | Return to waiting state |
| Face-Off | Start buzzer competition |
| Play | Team guessing phase |
| Steal | Other team's steal attempt |

### Buzzer Controls

| Button | Action |
|--------|--------|
| Unlock | Allow buzzer presses |
| Lock | Prevent buzzer presses |
| Reset | Clear buzz order |

### Answer Controls

| Button | Action |
|--------|--------|
| Answer #N | Toggle reveal for that answer |
| Reveal All | Show all remaining answers |
| Hide Answer | Click revealed answer to hide |

### Score Controls

| Button | Action |
|--------|--------|
| +10 / -10 | Adjust team score |
| Award Points | Give round points to team |

### Special Controls

| Button | Action |
|--------|--------|
| Show X | Display wrong answer animation |
| Add Strike | Add strike + show X |
| Timer | Start countdown for buzzer questions |
| Drinking Rules | Toggle rules display on TV |

## Tips

### Before the Party
- Test the full flow with 2-3 test players
- Prepare your contest JSON file
- Ensure TV display looks correct on your screen
- Have the admin panel open on tablet or laptop

### During the Game
- Keep energy high - you're the host!
- Use keyboard shortcuts if available
- Watch the buzzer order carefully for close calls
- Don't forget to award points before next question

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Buzzers not working | Check if locked, reset and unlock |
| Player disconnected | They can rejoin with same name/team |
| Wrong score | Use +/- buttons to correct |
| Need to restart round | Click "Reset Round" |
| Server crashed | Restart - state is auto-saved |
