# iTradeCoach.online

**Smarter Trading Starts Here**

iTradeCoach is an AI-powered trading education platform that combines real-time coaching, intelligent tutoring, and voice-based support to help users master Forex and Crypto markets.

## 🌐 Live Demo

👉 [Visit iTradeCoach.online](https://itradecoach.online)

## 🚀 Features

- 📘 **1-on-1 Coaching** with verified Forex/Crypto experts  
- 🤖 **AI Tutor (Tarvus)** for 24/7 interactive lessons  
- 🗣️ **Voice-enabled Assistant** powered by ElevenLabs  
- 📊 **Structured Courses** on trading psychology, technical analysis, and more  
- 🔒 **Secure User Accounts** with real-time progress tracking via Supabase  
- 💳 **Subscriptions** powered by RevenueCat  
- 🌐 **Deployed on Netlify** with a custom domain  

## 🧠 Built With

| Tech        | Role                                 |
|-------------|--------------------------------------|
| [Bolt](https://bolt.new) | Core development environment (frontend & logic) |
| [Supabase](https://supabase.com) | Authentication, real-time DB, user progress |
| [Netlify](https://www.netlify.com) | Hosting and deployment |
| [Tarvus](https://www.tarvus.ai) | Adaptive AI tutoring engine |
| [ElevenLabs](https://www.elevenlabs.io) | Voice-enabled multimodal support |
| [RevenueCat](https://www.revenuecat.com) | Subscription and billing management |

## 🔧 Local Development Setup Guide

This project was initially built using [Bolt](https://bolt.new), a cloud-based AI development platform. However, you can run it locally with the following steps:

---

### 🚀 1. Fork & Clone the Repository

1. **Fork** the repository to your GitHub account:  
   👉 [https://github.com/ImaJin14/iTradeCoach](https://github.com/ImaJin14/iTradeCoach)

2. **Clone** your forked version:
   ```bash
   git clone https://github.com/<your-username>/iTradeCoach.git
   cd iTradeCoach
   ```

---

### 📦 2. Install Dependencies

You can use either `npm` or `yarn` to install dependencies:

```bash
# Using npm
npm install

# OR using yarn
yarn install
```

---

### 🔐 3. Create a `.env` File

In the project root, create a `.env` file and fill in the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY=
NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY_SANDBOX=
REVENUECAT_SECRET_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=
STRIPE_SECRET_KEY_TEST=
REVENUECAT_WEBHOOK_SECRET=
TAVUS_API_KEY=
TAVUS_WEBHOOK_SECRET=  # optional
NEXT_PUBLIC_APP_URL=https://itradecoach.online
ELEVENLABS_API_KEY=
NEXT_PUBLIC_ELEVENLABS_DEFAULT_AGENT_ID=
ELEVENLABS_PREMIUM_AGENT_ID=
DAILY_API_KEY=
OPENAI_API_KEY=
OPENAI_API_KEY_Admin= 
```

⚠️ **Important:** Do not commit your `.env` file to version control!

---

### 🧪 4. Run the App Locally

Start the development server:

```bash
# Using npm
npm run dev

# OR using yarn
yarn dev
```

The app should now be running at:  
👉 [http://localhost:3000](http://localhost:3000)

## 🛣️ Roadmap

- TradingView integration for live market charts  
- Strategy simulators and backtesting tools  
- Multilingual support (Spanish, Hindi, Swahili)  
- Community forum and peer trading challenges  
- Public beta launch in Q4 2025  

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

**Built solo for the World’s Largest Hackathon using Bolt and bleeding-edge AI tools.**
