# 🍅 AI-Powered Pomodoro Timer

An intelligent Pomodoro timer that uses **AI-powered object detection** to track your focus and detect distractions in real-time. Built with Next.js, TypeScript, TensorFlow.js, and Tailwind CSS.

![Pomodoro Timer](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-AI-orange?style=for-the-badge&logo=tensorflow)

## ✨ Features

### 🤖 AI-Powered Distraction Detection
- **Real-time object detection** using TensorFlow.js and COCO-SSD model
- **Webcam monitoring** to detect phones, devices, and distractions
- **Smart tracking** - only studying time counts toward your goals
- **Honest accountability** - no manual overrides or cheating

### ⏱️ Pomodoro Timer
- Customizable focus and break durations
- Visual countdown with circular progress ring
- Start, pause, and reset controls
- Separate tracking for studying vs distracted time
- Browser notifications when sessions end
- Sound alerts (alarm support)

### 📊 Analytics & Insights
- **Real-time counters** showing studying vs distracted time
- **Profile dashboard** with total hours and focus statistics
- **7-day chart** visualizing daily focus minutes
- **Session history** with detailed breakdown
- **Productivity rate** calculation

### 🎨 Modern UI/UX
- 🌓 **Dark/Light mode** toggle
- 📱 **Fully responsive** design
- � **Clean interface** with Tailwind CSS
- 🌈 **Gradient backgrounds** and smooth animations
- � **LocalStorage persistence** for all data

## � Getting Started

### Prerequisites
- Node.js 18+ installed
- A webcam for AI detection features

### Installation

```bash
# Clone the repository
git clone https://github.com/osa539/pomodoro-timer.git
cd pomodoro-timer

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **AI/ML:** TensorFlow.js + COCO-SSD
- **Charts:** Recharts
- **State Management:** React Hooks
- **Storage:** Browser LocalStorage

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with ThemeProvider
│   ├── page.tsx             # Home page with features
│   ├── timer/
│   │   └── page.tsx         # AI-powered Pomodoro timer
│   ├── profile/
│   │   └── page.tsx         # Analytics dashboard
│   │   └── page.tsx         # Leaderboard page
│   └── globals.css          # Global styles
├── components/
│   ├── Navigation.tsx       # Navigation bar with theme toggle
│   ├── ThemeProvider.tsx    # Dark/Light mode context
│   └── PomodoroTimer.tsx    # Timer component
└── public/                  # Static assets
```

## 🎯 How It Works

1. **Start a Focus Session** - Click start on the Timer page
2. **AI Monitors You** - Webcam detects if you're studying or distracted
3. **Real-time Tracking** - See your studying/distracted time counters
4. **Session Complete** - Data saved to localStorage
5. **View Analytics** - Check your stats on the Profile page

### AI Detection Logic
- ✅ **Studying**: Person detected, no phone/distractions
- ❌ **Distracted**: Phone detected OR no person present
- 🔄 Updates every 5 seconds
- 📊 Only studying time counts toward focus minutes

## 📱 Screenshots

### Timer Page
- Circular progress ring with countdown
- Live webcam feed with object detection
- Status badge (Studying/Distracted)
- Real-time counters

### Profile Page
- Total Pomodoro Hours (gradient card)
- Total Focus Hours (gradient card)
- 7-day focus chart (Recharts)
- Recent sessions list

## 🚀 Deployment (Cloudflare Pages)

### Build Configuration
```bash
# Build command
npm run build

# Output directory
.next
```

### Environment Variables
No environment variables required - all data stored locally in browser.

### Steps
1. Push code to GitHub
2. Connect Cloudflare Pages to your repo
3. Set build command: `npm run build`
4. Set build output: `.next`
5. Deploy!

**Note:** Webcam access requires HTTPS, which Cloudflare Pages provides automatically.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

**osa539**

- GitHub: [@osa539](https://github.com/osa539)

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.