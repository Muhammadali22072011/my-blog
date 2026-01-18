# Muhammadali Blog

A modern minimalist blog with custom design, built on React + Vite + TailwindCSS.

## 🚀 Features

- **Minimalist design** - black, white, and gray color scheme
- **Dark/Light mode** - automatic theme switching with system preference support
- **Left navigation** - convenient vertical navigation panel
- **Markdown editor** - built-in editor for creating posts
- **Responsive design** - works on all devices
- **Modern technologies** - React 19, Vite, TailwindCSS
- **Media management** - image and video uploads
- **Admin panel** - full content management system

### New Features ✨
- **Comments system** - nested comments with real-time updates
- **Reactions** - emoji reactions on posts (👍❤️🔥👏🤔🚀)
- **View counter** - track post views
- **Bookmarks** - save posts to read later
- **Newsletter** - email subscription for updates
- **Table of Contents** - auto-generated for long posts
- **Reading progress** - progress bar while reading
- **Share buttons** - Telegram, Twitter, LinkedIn, copy link
- **Related posts** - show similar content
- **Post series** - group related articles
- **Skeleton loading** - smooth loading states
- **Scroll animations** - elements animate on scroll
- **SEO optimization** - Open Graph, Twitter Cards, meta tags
- **RSS feed** - subscribe via RSS reader
- **Auto-save drafts** - never lose your work
- **Schedule posts** - publish at specific time
- **Post analytics** - views, reactions, comments stats
- **Lazy loading images** - faster page loads
- **Syntax highlighting** - code blocks with highlighting

## 📱 Pages

- **Home** - profile and main information
- **Blogs** - list of posts organized by years and months
- **News** - latest updates and news
- **About Me** - detailed personal information
- **Media Manager** - manage images and videos
- **Admin** - creating and editing posts

## 🛠 Technologies

- React 19
- Vite
- TailwindCSS
- React Router DOM
- Supabase (backend)
- PostCSS

## 🚀 Project Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up database:**
   Run the SQL scripts in Supabase SQL Editor:
   - `supabase-schema.sql` - base tables
   - `add-new-features.sql` - new features (comments, reactions, newsletter)

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout
│   ├── Sidebar.jsx     # Left navigation
│   ├── MCEditor.jsx    # Markdown editor
│   ├── ImageUploader.jsx # Image upload component
│   └── VideoUploader.jsx # Video upload component
├── pages/              # Page components
│   ├── Home.jsx        # Home page
│   ├── Blogs.jsx       # Blogs page
│   ├── BlogPost.jsx    # Individual post
│   ├── News.jsx        # News
│   ├── AboutMe.jsx     # About me page
│   ├── MediaManager.jsx # Media management
│   └── Admin.jsx       # Admin panel
├── context/            # React context providers
├── services/           # API services
├── config/             # Configuration files
├── translations/       # Internationalization
├── App.jsx             # Main component
├── main.jsx            # Entry point
└── index.css           # Styles
```

## 🎨 Design

- **Color scheme:** White, black, gray with blue accents
- **Font:** Geist, Inter (system fallback)
- **Style:** Minimalism with modern UI elements
- **Navigation:** Vertical left panel with smooth transitions

## 📝 Markdown Editor

Built-in editor supports:
- Headings (# ## ###)
- Bold text (**text**)
- Italic text (*text*)
- Lists (- item)
- Code blocks (```)
- Links and images
- Real-time preview
- Media insertion

## 🔗 Contacts

- **Telegram channel:** @muhammadaliaiblog
- **Contact:** @zimdevuz

## 📄 License

MIT License
