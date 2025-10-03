# Pomodoro Timer

A minimal Next.js project with TypeScript and Tailwind CSS.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS for styling
- 📝 TypeScript for type safety
- 📏 ESLint for code linting
- 🧭 Navigation bar with multiple pages
- � Home page with feature overview
- ⏱️ Timer page for Pomodoro sessions
- 🏆 Leaderboard for productivity tracking
- 👤 Profile page with settings and stats

## Project Structure

```
src/
  app/
    layout.tsx         # Root layout with navigation
    page.tsx           # Home page
    timer/
      page.tsx         # Timer page
    leaderboard/
      page.tsx         # Leaderboard page
    profile/
      page.tsx         # Profile page
    globals.css        # Global styles with Tailwind
  components/
    Navigation.tsx     # Navigation bar component
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.