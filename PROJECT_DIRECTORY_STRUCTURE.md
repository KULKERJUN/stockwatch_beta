# Project Directory Structure

## Stock Market Trading Application

```
LAB_GIT UPDATED/
│
├── app/                                    # Next.js App Router
│   ├── favicon.ico
│   ├── globals.css                        # Global styles
│   ├── layout.tsx                         # Root layout
│   │
│   ├── (auth)/                           # Authentication routes
│   │   ├── layout.tsx                    # Auth layout
│   │   ├── sign-in/
│   │   │   └── page.tsx                  # Sign in page
│   │   └── sign-up/
│   │       └── page.tsx                  # Sign up page
│   │
│   ├── (root)/                           # Main app routes
│   │   ├── layout.tsx                    # Main layout
│   │   ├── page.tsx                      # Home/Dashboard page
│   │   ├── alerts/
│   │   │   └── page.tsx                  # Price alerts page
│   │   ├── compare/
│   │   │   └── page.tsx                  # Stock comparison page
│   │   ├── crypto/
│   │   │   ├── page.tsx                  # Crypto dashboard page
│   │   │   └── news/
│   │   │       └── page.tsx              # Crypto news page
│   │   ├── profile/
│   │   │   └── page.tsx                  # User profile page
│   │   ├── stocks/
│   │   │   └── [symbol]/
│   │   │       └── page.tsx              # Individual stock detail page
│   │   ├── trade/
│   │   │   └── page.tsx                  # Trading page
│   │   └── watchlist/
│   │       └── page.tsx                  # Watchlist page
│   │
│   └── api/                              # API routes
│       ├── inngest/
│       │   └── route.ts                  # Inngest webhook handler
│       ├── stocks/
│       │   └── route.ts                  # Stock API endpoints
│       └── users/
│           └── route.ts                  # User API endpoints
│
├── components/                            # React components
│   ├── AlertsList.tsx                    # Alert list component
│   ├── CompareStocksClient.tsx           # Stock comparison client
│   ├── CreateAlertButton.tsx             # Create alert button
│   ├── CryptoTable.tsx                   # Crypto table component
│   ├── Header.tsx                        # Header component
│   ├── NavItems.tsx                      # Navigation items
│   ├── PriceAlertManager.tsx             # Price alert manager
│   ├── SearchCommand.tsx                 # Search command palette
│   ├── TradeDashboardClient.tsx          # Trading dashboard client
│   ├── TradeModal.tsx                    # Trade modal component
│   ├── TradingViewWidget.tsx             # TradingView widget
│   ├── UserDropdown.tsx                  # User dropdown menu
│   ├── WatchlistButton.tsx               # Watchlist button
│   ├── WatchlistTable.tsx                # Watchlist table
│   │
│   ├── forms/                            # Form components
│   │   ├── CountrySelectField.tsx        # Country selector
│   │   ├── FooterLink.tsx                # Footer link component
│   │   ├── InputField.tsx                # Input field component
│   │   ├── PriceAlertForm.tsx            # Price alert form
│   │   └── SelectField.tsx               # Select field component
│   │
│   └── ui/                               # UI components (shadcn/ui)
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       └── tabs.tsx
│
├── database/                              # Database configuration
│   ├── mongoose.ts                       # MongoDB/Mongoose connection
│   └── models/                           # Database models
│       ├── Holding.ts                    # User holdings model
│       ├── PriceAlert.ts                 # Price alert model
│       ├── Transaction.ts                # Transaction model
│       ├── UserProfile.ts                # User profile model
│       └── watchlist.model.ts            # Watchlist model
│
├── hooks/                                 # Custom React hooks
│   ├── useDebounce.ts                    # Debounce hook
│   └── useTradingViewWidget.tsx          # TradingView widget hook
│
├── lib/                                   # Library functions and utilities
│   ├── constants.ts                      # App constants
│   ├── utils.ts                          # Utility functions
│   │
│   ├── actions/                          # Server actions
│   │   ├── ai.actions.ts                 # AI/OpenAI actions
│   │   ├── alert.actions.ts              # Alert management actions
│   │   ├── auth.actions.ts               # Authentication actions
│   │   ├── finnhub.actions.ts            # Finnhub API actions
│   │   ├── profile.actions.ts            # Profile management actions
│   │   ├── stock.actions.ts              # Stock data actions
│   │   ├── trade.actions.ts              # Trading actions
│   │   ├── user.actions.ts               # User management actions
│   │   └── watchlist.actions.ts          # Watchlist actions
│   │
│   ├── better-auth/                      # Authentication configuration
│   │   └── auth.ts                       # Better-auth setup
│   │
│   ├── inngest/                          # Background jobs (Inngest)
│   │   ├── client.ts                     # Inngest client
│   │   ├── functions.ts                  # Background job functions
│   │   └── prompts.ts                    # AI prompts
│   │
│   ├── models/                           # TypeScript models
│   │   ├── Stock.ts                      # Stock model
│   │   └── User.ts                       # User model
│   │
│   └── nodemailer/                       # Email service
│       ├── index.ts                      # Nodemailer setup
│       └── templates.ts                  # Email templates
│
├── middleware/                            # Next.js middleware
│   └── index.ts                          # Middleware configuration
│
├── public/                                # Static assets
│   └── assets/
│       ├── icons/
│       │   ├── logo.svg
│       │   └── star.svg
│       └── images/
│           ├── dashboard-preview.png
│           ├── dashboard.png
│           └── logo.png
│
├── types/                                 # TypeScript type definitions
│   └── global.d.ts                       # Global type declarations
│
├── components.json                        # shadcn/ui configuration
├── eslint.config.mjs                     # ESLint configuration
├── next-env.d.ts                         # Next.js type definitions
├── next.config.ts                        # Next.js configuration
├── package.json                          # NPM dependencies
├── postcss.config.mjs                    # PostCSS configuration
├── README.md                             # Project documentation
└── tsconfig.json                         # TypeScript configuration
```

## Key Features by Directory

### `/app` - Application Routes
- **Authentication**: Sign in/up pages with Better Auth
- **Dashboard**: Main trading dashboard with portfolio overview
- **Stocks**: Individual stock details and trading
- **Crypto**: Cryptocurrency tracking and news
- **Watchlist**: User's watched stocks
- **Alerts**: Price alert management
- **Compare**: Stock comparison tool
- **Profile**: User profile and settings
- **Trade**: Buy/sell trading interface

### `/components` - Reusable Components
- UI components using shadcn/ui design system
- Custom trading widgets (TradingView integration)
- Form components for user inputs
- Navigation and layout components

### `/lib/actions` - Server Actions
- Stock data fetching (Finnhub API)
- User authentication and profile management
- Trading operations (buy/sell)
- Watchlist and alert management
- AI-powered news summaries (OpenAI)

### `/lib/inngest` - Background Jobs
- **Daily news summary emails** (configurable cron: currently set to every 1 minute)
- **Price alert monitoring** (every 5 minutes)
- **Welcome emails** on user registration

### `/database` - Data Layer
- MongoDB with Mongoose ODM
- Models for users, holdings, transactions, alerts, watchlist

### Technologies Used
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Stock Data**: Finnhub API
- **Charts**: TradingView Widgets
- **Email**: Nodemailer (Gmail)
- **Background Jobs**: Inngest
- **AI**: OpenAI API

## Environment Variables Required
```
MONGODB_URI=
FINNHUB_API_KEY=
NEXT_PUBLIC_FINNHUB_API_KEY=
OPENAI_API_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=
```

## Installation & Setup
```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with the required variables

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

