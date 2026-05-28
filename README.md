# K-Game Deal Dashboard

A high-performance, standalone dashboard for tracking game deals in the South Korean market.

## Features

- **Korea-Focused Deals**: Fetches Steam deals specifically for the South Korean region (`cc=kr`, `l=korean`).
- **Metacritic Filtering**: Automatically filters for games with a Metacritic score of 70 or higher.
- **Fallback Link System**: Manually add store URLs (PSN KR, Nintendo KR) to your wishlist. The app fetches metadata via a backend scraper.
- **Price Watch**: Set target prices (KRW) for your wishlist games.
- **Gamer Aesthetic**: Dark theme with glassmorphism, responsive design, and platform-specific branding.
- **Security**: Sanitized API responses and secure outbound links.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide React, Framer Motion.
- **Backend**: Express (Node.js), Axios, Cheerio (for scraping).
- **Storage**: LocalStorage for wishlist and settings.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Start production server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env.local` file in the root directory if you need to add custom API keys (not required for basic Steam functionality).

```env
# Example
PORT=3000
```

## Security Note

All outbound links use `rel="noopener noreferrer"` to prevent security risks. API responses are handled through standard React rendering to prevent XSS.
