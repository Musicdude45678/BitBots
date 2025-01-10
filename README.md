# BitBots - Create, Customize, and Share AI Bots

BitBots is a web application that allows users to create, customize, and share AI-powered chatbots. Each bot can be customized with its own personality and capabilities through system prompts, enabling unique and engaging conversations.

## Features

### Bot Management
- Create and customize AI bots with unique system prompts
- Edit bot details including name, description, and system prompt
- Delete bots and their associated chat history
- Share bots with other users via unique links

### Chat Interface
- Real-time chat interface powered by OpenAI's GPT API
- Multiple chat sessions per bot
- Instant message display with smooth auto-scrolling
- Message timestamps and chat history
- Clean, modern UI with mobile responsiveness

### User Experience
- Secure user authentication with Firebase
- Dashboard to manage all your bots
- Sidebar navigation for quick access to chats
- Share and collaborate with other users
- Real-time updates and message synchronization
- Modern, responsive UI built with React and TailwindCSS

### Technical Features
- TypeScript for enhanced type safety
- Firebase Firestore for real-time data storage
- OpenAI integration for natural language processing
- Vite for fast development and building
- TailwindCSS for responsive styling
- Heroicons for beautiful UI elements

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Firebase account
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd BitBots
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## Development Tools

- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files
- **commitlint** - Lint commit messages

## Code Quality

This project uses several tools to ensure code quality:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for consistent code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for running linters on staged files
- **commitlint** for conventional commit messages

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/        # Configuration files (Firebase, etc.)
├── contexts/      # React contexts (Auth, etc.)
├── pages/         # Main application pages
├── services/      # API and service functions
└── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[Your License Here]
