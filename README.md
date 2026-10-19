# MP3Arena

A mobile-friendly music web app built with Next.js. Search for songs, keep tracks playing in the background, and scroll through trending music like reels.

## Features

- **Login system**: username and password, with the session stored in a secure cookie
- **Hybrid search**: results from YouTube (video) and Audius (background-ready audio) in one list
- **Background play**: Audius tracks keep playing when you switch apps, with lock-screen controls
- **Trending reels**: a swipe-style feed of trending songs that plays the next track automatically
- **Liked songs** list
- **Responsive layout** for phone and laptop

## Tech stack

Next.js 15, React 19, TypeScript, Tailwind CSS, jose (JWT sessions)

## Project structure

```
app/
  page.tsx            main page (search, player, liked songs)
  reels/page.tsx      trending reels feed
  login/page.tsx      login page
  api/
    login/            checks username and password, sets the session cookie
    logout/           clears the session cookie
    search/           YouTube search
    audius/           Audius search
    audius/stream/    Audius audio stream
    trending/         trending songs (YouTube + Audius)
lib/auth.ts           session helpers
middleware.ts         redirects visitors who are not logged in
```

## Getting started

1. Install Node.js 18.18 or newer.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your values:
   ```
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key
   AUTH_SECRET=a_long_random_text_of_32_or_more_characters
   AUTH_USERS=username:password,friend:password
   AUDIUS_API_KEY=
   ```
   `AUDIUS_API_KEY` is optional. Leave it empty unless Audius asks for a key.
4. Start the dev server:
   ```
   npm run dev
   ```
   Then open http://localhost:3000 and log in with a username and password from `AUTH_USERS`.

### Getting a YouTube API key

1. Open the Google Cloud Console and create a project.
2. Enable **YouTube Data API v3** under APIs & Services → Library.
3. Go to Credentials → Create Credentials → API key.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import it in Vercel (Add New → Project).
3. Add `YOUTUBE_API_KEY`, `AUTH_SECRET` and `AUTH_USERS` under Environment Variables.
4. Click Deploy. After changing any variable later, redeploy.

## Notes

- YouTube tracks play through the official YouTube embedded player, so the video stays visible. Background playback of these tracks depends on your browser and is not guaranteed.
- Audius tracks stream from the Audius API and are mostly independent artists.
- Users are defined in the `AUTH_USERS` environment variable. To add a user, add `name:password` to it (separated by commas, and passwords cannot contain a comma), then redeploy.
- Never commit `.env.local`. It holds your API key and passwords, and `.gitignore` already excludes it.
- This project is not affiliated with YouTube or Audius.
