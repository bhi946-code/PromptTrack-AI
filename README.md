# PromptTrack AI

A tool that sends your prompt to Google Gemini and OpenAI GPT-4o Mini at the same time, tracks whether a brand is mentioned, checks if it was cited as a source, and analyzes the sentiment — all saved to a real database with history and analytics.

🔗 Live Demo: https://prompt-track-mrnuqvdp0-agi-prompt-platform.vercel.app
📁 GitHub: https://github.com/bhi946-code/PromptTrack-AI

---

## What It Does

- Enter any prompt and a brand name to track
- Both Gemini and GPT-4o Mini run at the same time
- Responses appear side by side on screen
- Each response shows — was the brand mentioned, was it cited, what was the sentiment
- Every run is saved automatically to a Supabase database
- History Log lets you filter all past runs by date, model, brand, or mention status
- Analytics Dashboard shows a chart of brand mentions over time

---

## How to Run Locally

You need Node.js v18+, a free OpenRouter API key, and a free Supabase project.

- git clone https://github.com/bhi946-code/PromptTrack-AI
- cd PromptTrack-AI
- npm install
- npm run dev
- Open the app, click Settings, enter your OpenRouter key and Supabase credentials
- Keys are saved in the browser — nothing is hardcoded in the code

---

## Tech Decisions

- **React + Vite** — fast to build with, easy to deploy
- **Supabase** — real Postgres database, free tier, no need for a separate backend
- **OpenRouter** — one API that connects to both Gemini and OpenAI together
- **Gemini model** — google/gemini-3.5-flash
- **OpenAI model** — openai/gpt-4o-mini
- **Vercel** — free deployment connected directly to GitHub

---

## Competitive Research

Looked at Brandwatch, Otterly.AI, Profound, and Brand24 before building.

- **Brandwatch** — social media tracking only, no AI model monitoring, expensive
- **Otterly.AI** — tracks brand mentions in AI but does not compare two models side by side
- **Profound** — built for search engine results, not prompt evaluation
- **Brand24** — social media only, no LLM integration at all

What makes PromptTrack AI different — it is the only tool that shows Gemini and GPT-4o Mini responses side by side in one screen with mention, citation, and sentiment tracked separately for each model.

---

## Problems Faced and How I Fixed Them

**OpenRouter credits ran out during testing**
Running two models at once uses free credits twice as fast. Hit the limit multiple times. Created three separate OpenRouter accounts with fresh free credits to keep the app working throughout testing. Not a permanent fix but kept everything live within the zero-budget requirement.

**App gave 404 error on page refresh after deployment**
React Router handles navigation client side. Vercel was looking for a static file on each path and returning 404 on refresh. Fixed by adding a vercel.json file that tells Vercel to always serve index.html and let React handle routing.

**Both models slow down together**
Both API calls fire at the same time and the app waits for both before showing results. Accepted this for now to keep the code simple and clean. Next version would show each model's response as soon as it arrives independently.

---

## Trade-offs Made

- API keys stored in browser localStorage — production version would use server-side auth
- Sentiment uses keyword matching — next version would use a dedicated AI call for accuracy
- No batch prompt runs yet — would be added in the next version
