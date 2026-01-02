# Game Photos

This folder contains photos used for photo-based questions in the game.

## Adding Photos

1. Place your photos in this folder (jpg, jpeg, png formats supported)
2. Reference them in your contest JSON with `/data/your-photo.jpg`

## Example

In your contest JSON:
```json
{
  "id": 1,
  "type": "buzzer",
  "category": "Photo",
  "question": "What year was this photo taken?",
  "mediaUrl": "/data/vacation-2020.jpg",
  "correctAnswer": "2020"
}
```

## Note

Photos in this folder are gitignored by default to protect privacy.
