# Flappy Bird Music Backend

A simple Node.js/Express backend server for managing and serving music to the Flappy Bird game.

## Features

- Search songs by title, artist, or genre
- Get all songs
- Get song by ID
- Filter songs by genre
- Add new songs
- Update existing songs
- Delete songs
- CORS enabled for frontend integration

## Installation

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Get All Songs
```
GET /api/songs
```

### Search Songs
```
GET /api/songs/search?q=<query>
```
Example: `GET /api/songs/search?q=piano`

### Get Song by ID
```
GET /api/songs/:id
```
Example: `GET /api/songs/1`

### Get Songs by Genre
```
GET /api/songs/genre/:genre
```
Example: `GET /api/songs/genre/Jazz`

### Add New Song
```
POST /api/songs
Content-Type: application/json

{
    "title": "Song Title",
    "artist": "Artist Name",
    "url": "https://example.com/song.mp3",
    "genre": "Genre",
    "duration": 300
}
```

### Update Song
```
PUT /api/songs/:id
Content-Type: application/json

{
    "title": "Updated Title",
    "artist": "Updated Artist",
    "genre": "Updated Genre"
}
```

### Delete Song
```
DELETE /api/songs/:id
```

### Health Check
```
GET /api/health
```

## Response Format

All responses follow this format:

```json
{
    "success": true,
    "data": {},
    "message": "Success message (if any)"
}
```

## Environment Variables

Create a `.env` file in the backend folder:

```
PORT=5000
NODE_ENV=development
```

## Default Songs

The backend comes with 6 default sample songs:
- Lofi Beats
- Chill Vibes
- Piano Melody
- Electronic Groove
- Ambient Sounds
- Jazz Cafe

## Frontend Integration

Update your frontend to use the backend endpoints instead of external APIs:

```javascript
// Search songs
fetch('http://localhost:5000/api/songs/search?q=jazz')
    .then(res => res.json())
    .then(data => console.log(data));

// Get all songs
fetch('http://localhost:5000/api/songs')
    .then(res => res.json())
    .then(data => console.log(data));
```
