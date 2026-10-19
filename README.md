# My Music (Next.js)

Features: login, YouTube + Audius search, background-play music (Audius), trending reels.

## Chalane ke steps
1. Node.js 18.18+ install karein (nodejs.org, LTS)
2. Is folder ko VS Code mein kholein, terminal mein: `npm install`
3. `.env.example` ko copy karke `.env.local` naam dein aur values bharein
4. `npm run dev` -> http://localhost:3000
5. Login karein (AUTH_USERS wale username:password se)

## Vercel par deploy
1. GitHub par push karein (`.env.local` push nahi hota)
2. vercel.com -> Add New Project -> repo import
3. Environment Variables mein YOUTUBE_API_KEY, AUTH_SECRET, AUTH_USERS daalein
4. Deploy (env badalne par Redeploy)
