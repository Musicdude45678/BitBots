# BitBots - Create, Customize, and Share AI Bots

BitBots is a web application that allows users to create, customize, and share AI-powered chatbots. Each bot can be customized with its own personality and capabilities through system prompts.

## Features

- User authentication with Firebase
- Create and customize AI bots with unique system prompts
- Interactive chat interface powered by OpenAI's GPT API
- Share bots with other users
- Offline access to chat history
- Modern, responsive UI built with React and TailwindCSS

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

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication and Firestore in your project
3. Add a web app to your project and copy the configuration values to your `.env` file

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

[Your chosen license]
