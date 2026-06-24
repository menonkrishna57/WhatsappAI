# WhatsappAI - Developer Onboarding Guide

Welcome to the **WhatsappAI** repository! This guide will help you set up and run the application locally.

---

## 🏗️ Tech Stack
*   **Backend:** FastAPI, Python, Uvicorn, Supabase Python Client.
*   **Frontend:** React (Vite), Tailwind CSS, React Router DOM, Supabase JS Client.

## 🛠️ Step-by-Step Setup

Follow these instructions to run the frontend and backend manually.

### 1. Backend Setup
The backend is built with **Python & FastAPI**.

1. Navigate to the backend directory:
   ```bash
   cd dashboard/backend
   ```
2. Set up and activate a virtual environment (optional but recommended, e.g. using `venv` or your preferred tool):
   * **Create environment:**
     ```bash
     python -m venv venv
     ```
   * **Activate environment:**
     * *Windows (PowerShell):*
       ```powershell
       .\venv\Scripts\Activate.ps1
       ```
     * *macOS/Linux:*
       ```bash
       source venv/bin/activate
       ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   python view_orders.py
   ```
   * The backend API will be available at **`http://localhost:8000`**.
   * Interactive API docs (Swagger) are at **`http://localhost:8000/docs`**.

### 2. Frontend Setup
The frontend is built using **React + Vite** and styled with **Tailwind CSS**.

1. Navigate to the frontend directory:
   ```bash
   cd dashboard/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
   > [!IMPORTANT]
   > Do not skip this step! We recently integrated Tailwind CSS, PostCSS, and Autoprefixer. You must run `npm install` to download these new styling dependencies.
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   * The frontend will be available at **`http://localhost:5173`**.

---

## 🔑 Environment Variables

Make sure you have a single `.env` file created at the workspace root (`f:\WhatsappAI\.env`) with the following keys:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

*Note: Vite has been configured in `vite.config.js` to look in the workspace root and accept `SUPABASE_` prefixes, meaning the frontend and backend share this exact file.*

---

## 📁 Repository Structure
*   `dashboard/backend/`: Fast API server files.
    *   `view_orders.py`: Main router and endpoint handling. Contains new endpoint for `GET /customers`.
    *   `auth_backend.py`: Helper script verifying Supabase JWT tokens.
*   `dashboard/frontend/`: React application.
    *   `src/components/layout/`: Holds the shell components (`DashboardLayout`, `Sidebar`, `Header`).
    *   `src/styles.css`: Directives for Tailwind styling.
    *   `src/*Page.jsx`: The layout placeholder page files for each developer to start building on.
