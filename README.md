# Prompt or Die - Visual AI Prompt Builder

**Design prompts like design systems.** Build modular AI prompts with drag-and-drop blocks, preview in real-time, and export to any agent framework.

## 🚀 Getting Started

This project is built with modern web technologies including React, TypeScript, Vite, and Tailwind CSS.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd prompt-or-die-1
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Architecture

The application is built using a modular architecture with the following key technologies:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom component library built on Radix UI

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility functions and helpers
├── pages/             # Application pages/routes
└── main.tsx          # Application entry point
```

## 🎨 Features

- **Visual Prompt Builder**: Drag-and-drop interface for creating AI prompts
- **Modular Blocks**: Reusable prompt components
- **Real-time Preview**: See your prompts in action
- **Export Options**: Export to various agent frameworks
- **Project Management**: Organize your prompts into projects
- **Gallery**: Browse and use community prompt templates

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

### Recommended Hosting

- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Website**: [www.promptordie.tech](https://www.promptordie.tech)
- **Documentation**: Coming soon
- **Discord**: Join our community (link coming soon)

## 🆘 Support

If you need help or have questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Join our Discord community for real-time support

---

Built with ❤️ by the Prompt or Die team
