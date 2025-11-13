# English Chat Site - Frontend

A Next.js application for an English learning chat website that will connect with a Spring Boot backend.

## 🚀 Features

- **Main Page**: Landing page with feature overview
- **Chat System**:
  - AI Chat: Practice with intelligent AI tutor
  - User Chat: Connect with other English learners worldwide
- **Smart Translation**: Korean-English translation with automatic vocabulary tracking
- **Learning Notes**: Track and review vocabulary learned through chat
- **User Profile**: Manage profile and view learning statistics
- **Authentication**: Login and signup pages (ready for Spring Boot integration)

## 🏗️ Project Structure

```
src/
├── app/                      # Next.js 14 App Router
│   ├── auth/                 # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── chat/                 # Chat functionality
│   │   ├── ai/              # AI chat page
│   │   ├── user/            # User chat page
│   │   └── page.tsx         # Chat selection page
│   ├── learning-notes/       # Vocabulary tracking
│   ├── profile/             # User profile page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
└── components/              # Reusable components
    ├── Header.tsx           # Navigation header
    └── Footer.tsx           # Site footer
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint
- **Development**: Hot reload with Turbopack support

## 🚦 Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Available Pages

- `/` - Home page with feature overview
- `/chat` - Chat selection (AI vs User chat)
- `/chat/ai` - AI chat interface with translation features
- `/chat/user` - User chat rooms and real-time messaging
- `/learning-notes` - Vocabulary tracking and progress
- `/profile` - User profile and statistics
- `/auth/login` - User login
- `/auth/signup` - User registration

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🎨 Key Features

### Smart Translation

- Detect Korean words in English sentences
- Automatic translation to English
- Save translated words to learning notes
- Context-aware vocabulary tracking

### AI Chat

- Interactive English conversation practice
- Real-time translation assistance
- Automatic vocabulary logging
- Adaptive difficulty levels

### User Chat

- Real-time chat rooms
- Global user connections
- Topic-based conversations
- Cultural exchange opportunities

### Learning Notes

- Vocabulary progress tracking
- Search and filter capabilities
- Mastery status management
- Usage context preservation

## 🔮 Future Integration

This frontend is designed to integrate with a Spring Boot backend that will provide:

- User authentication and authorization
- Real-time chat functionality
- AI translation services
- Data persistence
- REST API endpoints

## 🚀 Deployment

The project is optimized for deployment on Vercel, Netlify, or any platform supporting Next.js applications.

```bash
# Build for production
npm run build

# The build output will be in the .next folder
```

## 📝 Environment Variables

When integrating with the backend, you'll need to set up environment variables:

```env
NEXT_PUBLIC_API_URL=your-spring-boot-backend-url
NEXT_PUBLIC_TRANSLATION_API=your-translation-service-url
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
