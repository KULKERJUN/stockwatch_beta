This is a [Next.js](https://nextjs.org) project.

## Prerequisites (Windows)

- Node.js LTS (v18.18+ recommended, v20+ OK): https://nodejs.org/en/download
- Git: https://git-scm.com/downloads
- A package manager: npm (bundled with Node). You may also use yarn/pnpm/bun if preferred.

Verify after install in a new PowerShell:

```powershell
node -v
npm -v
```

## Environment variables

Create a `.env.local` in the project root (same folder as `package.json`) using the example below:

```bash
# Database (MongoDB Atlas or local MongoDB)
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"

# Finnhub (news & market data)
# Either FINNHUB_API_KEY (server) or NEXT_PUBLIC_FINNHUB_API_KEY (client) – one is required
FINNHUB_API_KEY=""
NEXT_PUBLIC_FINNHUB_API_KEY=""

# Email (Nodemailer SMTP)
NODEMAILER_EMAIL=""
NODEMAILER_PASSWORD=""

# Better Auth
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000" # base URL of the app during dev

# Inngest AI (Gemini)
GEMINI_API_KEY=""
```

You can also copy the provided `.env.example` to `.env.local` and fill values:

```powershell
copy .env.example .env.local
```

## Install dependencies

From the project root directory:

```powershell
# Prefer clean install when lockfile is present
npm ci
# If that fails (e.g., first setup), run:
npm install
```

## Run the development server

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

## Recommended VS Code extensions

- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

## Notes

- This project uses Next.js App Router and React 19.
- Ensure your environment variables are set; missing keys (e.g., Finnhub or MongoDB) can cause runtime errors when visiting parts of the app that need them.
