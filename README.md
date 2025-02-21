# Todo App Client

[Click here to view the live project](https://simple-firebase-39f4b.web.app)

A simple and efficient **To-Do App** client built with **React**, **Vite**, and **Tailwind CSS**. This project serves as the frontend for managing to-do tasks with drag-and-drop functionality and Firebase integration.

## ✨ Features

- ✅ **React 19 with Vite** – Fast and optimized frontend development.
- 🎨 **Tailwind CSS** – For modern and responsive styling.
- 🔄 **Drag-and-Drop** – Manage tasks interactively using `@dnd-kit`.
- 🔥 **Firebase Integration** – Syncs tasks in real-time.
- 🚀 **Optimized Performance** – Using best practices for a smooth user experience.
- ✅ **ESLint Support** – For maintaining clean and consistent code.

## 📥 Installation

To set up the project locally, follow these steps:

```sh
# Clone the repository
git clone https://github.com/your-username/todo-app-client.git

# Navigate into the project directory
cd todo-app-client

# Install dependencies
npm install
```

## 🚀 Usage

### Start the development server:

```sh
npm run dev
```

The app will be available at `http://localhost:5173/` (default Vite port).

### Build for production:

```sh
npm run build
```

### Preview the production build:

```sh
npm run preview
```

## ⚙️ Configuration

This project integrates **Firebase**, and you may need to configure your Firebase credentials.  
Create a `.env` file in the root directory and add your Firebase configuration:

```sh
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📦 Dependencies

This project uses the following dependencies:

### **Main Dependencies**
- **React 19** (`react`, `react-dom`) – UI framework
- **React Router** (`react-router-dom`) – Navigation
- **Tailwind CSS** (`tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer`) – Styling
- **Drag-and-Drop** (`@dnd-kit/core`, `@dnd-kit/sortable`) – Interactive task management
- **Axios** (`axios`) – HTTP requests
- **Firebase** (`firebase`) – Backend integration

### **Development Dependencies**
- **Vite** (`vite`, `@vitejs/plugin-react`) – Build tool
- **ESLint** (`eslint`, `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) – Code linting
- **TypeScript Support** (`@types/react`, `@types/react-dom`, `globals`) – Type definitions

## 🛠 Development

### Run ESLint:

```sh
npm run lint
```

### Format Code:

Using VSCode with ESLint & Prettier extensions is recommended for maintaining code quality.
