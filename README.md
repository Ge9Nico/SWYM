# SWYM - See What You're Missing

SWYM is an AI-powered web application that automatically finds, organizes, and explains the hidden benefits and coverage within your insurance policies and credit card documents. Stop leaving money on the table and get clarity on what you own.



## ✨ Key Features

- **AI-Powered Analysis:** Securely upload a document (PDF or image) and let the AI extract key details, perks, and coverage information.
- **Centralized Dashboard:** View all your policies and their most important benefits in one clean, easy-to-understand interface.
- **Benefit Discovery:** Uncover valuable perks like airport lounge access, travel insurance, and purchase protection that you never knew you had.
- **Duplicate Coverage Detection:** Stop overpaying for standalone insurance when you're already covered by your existing policies.
- **Q&A with Your Policies:** Ask questions in plain language (e.g., "Am I covered for a trip to the US?") and get answers based on your combined documents.

---

## 💻 Technology Stack

This project is built with a modern, scalable, serverless architecture.

- **Frontend:** [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Firebase Cloud Functions](https://firebase.google.com/docs/functions) (Node.js)
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth)
- **File Storage:** [Cloud Storage for Firebase](https://firebase.google.com/docs/storage)
- **AI & Machine Learning:**
    - [Google Gemini API](https://ai.google.dev/) for structured data extraction and analysis.
    - [Google Cloud Vision API](https://cloud.google.com/vision) for Optical Character Recognition (OCR).

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Firebase account](https://firebase.google.com/) and a new project created.
- [Firebase CLI](https://firebase.google.com/docs/cli) installed and configured (`npm install -g firebase-tools`)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/swym.git](https://github.com/your-username/swym.git)
    cd swym
    ```

2.  **Install frontend dependencies:**
    ```sh
    npm install
    ```

3.  **Install backend dependencies:**
    ```sh
    cd functions
    npm install
    cd ..
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project. This file will store your Firebase configuration and API keys. **Do not commit this file to version control.**

    ```env
    # .env
    # Get these from your Firebase project settings
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

    # Get this from Google AI Studio
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

5.  **Connect to your Firebase Project:**
    ```sh
    firebase use --add
    ```
    Select the Firebase project you created for SWYM.

### Usage

- **Run the local development server (frontend):**
  ```sh
  npm run dev
  ```
  This will start the React app, usually on `http://localhost:5173`.

- **Deploy the application:**
  1.  **Build the frontend:**
      ```sh
      npm run build
      ```
  2.  **Deploy everything to Firebase:**
      ```sh
      firebase deploy
      ```
      Or deploy services individually:
      ```sh
      firebase deploy --only hosting  # Deploy only the frontend
      firebase deploy --only functions # Deploy only the backend
      ```

---
