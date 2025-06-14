# PrepBuddy - AI-Powered Study Planner

A professional EdTech application that transforms your study materials into personalized learning plans using **real AI models** and **cloud synchronization** - completely free!

## 🚀 New Features

### Hybrid Storage System
- **Cloud Sync**: All your data is automatically synchronized with Supabase
- **Offline Support**: Continue studying even without internet connection
- **Real-time Updates**: Changes sync across all your devices instantly
- **Data Security**: Your study plans are safely stored in the cloud

### Enhanced Architecture
- **Zustand State Management**: Efficient local state management
- **Supabase Integration**: Robust cloud database with real-time capabilities
- **Optimistic Updates**: Immediate UI updates with background sync
- **Error Handling**: Graceful fallbacks when offline or sync fails

## 🤖 Real AI Integration

PrepBuddy uses **actual AI models** to analyze your content and generate truly personalized study plans:

### Free AI Providers Supported:

1. **🚀 Groq API** (Recommended)
   - **Model**: Llama 3 8B-8192 (Fast & Powerful)
   - **Free Tier**: 100 requests/day
   - **Setup**: [console.groq.com](https://console.groq.com/)

2. **⚡ Together AI**
   - **Model**: Mixtral-8x7B-Instruct
   - **Free Tier**: Available
   - **Setup**: [api.together.xyz](https://api.together.xyz/)

3. **🔄 OpenRouter**
   - **Models**: Multiple free options
   - **Free Tier**: Various models available
   - **Setup**: [openrouter.ai](https://openrouter.ai/)

## ✨ What Makes PrepBuddy Different

### Real AI Analysis:
- **Content Understanding**: AI actually reads and comprehends your material
- **Topic Extraction**: Identifies key concepts from your specific content
- **Complexity Analysis**: Adapts to your material's difficulty level
- **Personalized Tasks**: Creates specific activities based on your content

### Cloud-Powered Features:
- **Multi-Device Sync**: Access your study plans from anywhere
- **Real-time Collaboration**: Share and collaborate on study groups
- **Progress Tracking**: Your achievements and streaks sync across devices
- **Backup & Recovery**: Never lose your study progress

### Smart Fallbacks:
- **Enhanced Algorithms**: Intelligent content processing when AI isn't available
- **Offline Mode**: Continue studying without internet connection
- **Progressive Enhancement**: Better with AI, still great without

## 🚀 Quick Setup (5 minutes)

### Step 1: Set up Supabase (2 minutes)

1. **Create a Supabase Project**:
   ```bash
   # Visit: https://supabase.com
   # Click "New Project"
   # Choose your organization and create project
   ```

2. **Get your credentials**:
   ```bash
   # Go to Settings > API
   # Copy your Project URL and anon public key
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key to .env
   ```

### Step 2: Connect to Supabase

Click the "Connect to Supabase" button in the top right of the app to automatically set up your database schema.

### Step 3: Add AI (Optional but Recommended)

1. **Get a Free API Key** (choose one):
   ```bash
   # Groq (Recommended - fastest)
   Visit: https://console.groq.com/
   
   # Together AI
   Visit: https://api.together.xyz/
   
   # OpenRouter
   Visit: https://openrouter.ai/
   ```

2. **Add to .env file**:
   ```bash
   # Add your AI key to .env file
   ```

### Step 4: Run PrepBuddy

```bash
npm install
npm run dev
```

## 🎯 Features

### Core Features
- **📄 Universal File Support**: PDF, DOCX, TXT, MD, RTF, LaTeX, BibTeX
- **✍️ Combined Input**: Upload files AND add additional notes
- **🤖 Real AI Analysis**: Actual content understanding and personalization
- **⚙️ Full Customization**: Duration, study time, difficulty levels
- **📊 Progress Tracking**: Interactive task completion system

### Cloud Features
- **☁️ Cloud Sync**: Automatic synchronization across devices
- **👥 Study Groups**: Collaborate with other learners
- **📈 Analytics**: Detailed progress tracking and insights
- **🔄 Real-time Updates**: Changes sync instantly
- **📱 Multi-Device**: Access from phone, tablet, or computer

### Smart Features
- **🧠 AI Coaching**: Get help with specific tasks
- **🎯 Adaptive Learning**: Plans adjust to your progress
- **🏆 Achievement System**: Gamified learning experience
- **📅 Smart Scheduling**: Optimized study sessions
- **🔔 Reminders**: Stay on track with your goals

## 🏗️ Architecture

### Frontend
- **React + TypeScript**: Modern, type-safe development
- **Tailwind CSS**: Beautiful, responsive design
- **Zustand**: Lightweight state management
- **Vite**: Fast development and building

### Backend
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Secure data access
- **Real-time Subscriptions**: Live updates
- **Edge Functions**: Serverless API endpoints

### AI Integration
- **Multiple Providers**: Groq, Together AI, OpenRouter
- **Intelligent Fallbacks**: Always works, even without AI
- **Content Analysis**: Advanced NLP for understanding
- **Personalization**: Tailored to your specific content

## 📊 Database Schema

The app uses a robust PostgreSQL schema with:

- **Profiles**: User information and preferences
- **Study Plans**: AI-generated learning paths
- **Task Completions**: Progress tracking
- **Quiz Results**: Assessment data
- **Study Groups**: Collaborative learning

All tables include Row Level Security for data protection.

## 🔧 Technical Details

### State Management
- **Zustand Stores**: Modular state management
- **Persistence**: Local storage with cloud sync
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Graceful handling of sync failures

### Offline Support
- **Local Storage**: Continue working offline
- **Sync Queue**: Changes sync when connection returns
- **Conflict Resolution**: Smart merging of changes
- **Progressive Enhancement**: Works with or without internet

### Security
- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure user sessions
- **API Key Protection**: Environment variable security
- **Data Encryption**: Secure data transmission

## 🌟 Why PrepBuddy's Hybrid Approach?

1. **Best of Both Worlds**: Local speed + cloud reliability
2. **Always Available**: Works offline and online
3. **Multi-Device**: Sync across all your devices
4. **Collaborative**: Share and learn together
5. **Scalable**: Grows with your learning needs
6. **Secure**: Enterprise-grade data protection

## 🚀 Deployment

Ready for production deployment:

```bash
npm run build
# Deploy to Netlify, Vercel, or any static host
# Set up Supabase environment variables
```

## 🤝 Contributing

Want to add more features or improve the hybrid storage? Contributions welcome!

## 📄 License

MIT License - Build amazing EdTech tools with hybrid storage!

---

**🎓 Transform your learning with PrepBuddy - Your AI study companion with cloud sync that actually understands your content!**