// app/page.tsx
"use client";
import { useState } from "react";
import { Sun, Moon, Utensils, ShoppingCart, Loader, Sparkles } from "lucide-react";
import confetti from 'canvas-confetti';
// --- Import the new Dynamic Response Renderer ---
import DynamicResponseRenderer from '../components/DynamicResponseRenderer'; // Adjust the path if needed

// --- Define Types for the Different AI Response Structures ---
// (Keep all your existing type definitions and type guards here)
// --- For brevity in this example, I'm assuming they are defined above or in a shared file ---
// If they are only in this file, keep them. Otherwise, you might move them to a lib/types.ts
// and import them here.

// Example of keeping one type/interface here for context:
interface GroceryItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}
// ... (rest of your interfaces like ShoppingListResponse, MealPlanResponse, etc.) ...
// ... (rest of your type guards like isShoppingListResponse, isMealPlanResponse, etc.) ...

// --- End of Type Definitions and Guards ---

export default function App() {
  const [input, setInput] = useState<string>("");
  // Change the state type to hold the raw API response object
  const [apiResponse, setApiResponse] = useState<{ answer?: string } | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) {
      setError("Please enter your request.");
      return;
    }

    setBusy(true);
    setApiResponse(null); // Clear previous response
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json(); // This is the full API response object { answer: "..." }
      console.log("Raw API Response Object:", data);

      // Store the entire API response object
      setApiResponse(data);

      // Basic check for success or presence of answer to trigger confetti
      if (data.answer || (typeof data === 'object' && data.success !== false)) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

    } catch (err) {
      console.error("Frontend Fetch Error:", err);
      setError("❌ Failed to connect to the server or process the response. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // --- Simplified Export Function ---
  // This version relies on the raw `answer` string.
  // A more advanced version could pass the parsed data if available from the renderer/context.
  function exportShoppingList() {
    if (!apiResponse?.answer) return;

    const lines = [
      "🤖 AI Response Export",
      "======================",
      "",
      apiResponse.answer // Export the raw answer string
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-response-export.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  // --- End of Simplified Export Function ---

  return (
    <div className={darkMode ? "app-container dark-mode" : "app-container light-mode"}>
      <div className="main-content-wrapper">
        {/* Header */}
        <header className="header-section">
          <h1 className="app-title">
            <Utensils className="icon" />
            Grocery Planner AI
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle-btn"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="icon" /> : <Moon className="icon" />}
          </button>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <h2 className="hero-title">Plan Your Meals with AI</h2>
          <p className="hero-subtitle">
            Enter your dietary goals (e.g., 140g protein, 80 kr/day) and get a smart, optimized shopping list or meal plan.
          </p>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-container">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 140g protein, 80 kr/day, low-carb, 2 meals, no fish..."
                className="input-field"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy}
                className={`submit-btn ${busy ? "disabled" : ""}`}
              >
                {busy ? <Loader className="spinner" /> : "Generate Plan"}
              </button>
            </div>
          </form>
        </section>

        {/* Loading Spinner */}
        {busy && (
          <div className="loader-message-container">
            <Sparkles className="sparkle-spinner" />
            <p>AI is generating your plan...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="message-card error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {/* This section is now greatly simplified */}
        {apiResponse && !busy && (
          <section className="results-section">
            {/* The DynamicResponseRenderer handles ALL the logic and rendering */}
            <DynamicResponseRenderer rawAnswer={apiResponse.answer || "No answer content found in API response."} />

            {/* Export Button - shown if there's an answer */}
            {/* You might want to conditionally render this based on the parsed content type later,
                or let the DynamicResponseRenderer handle its own internal export if it parses successfully. */}
            {apiResponse.answer && (
              <div className="export-container">
                <button
                  onClick={exportShoppingList}
                  className="export-btn"
                >
                  <span className="export-btn-content">
                    <ShoppingCart className="icon" /> Export Raw Response
                  </span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>Made with ❤️ by Upendra | All rights reserved</p>
        </footer>
      </div>
      <style>
        {`
        /* --- Color Variables & Theming --- */
        :root {
          --dark-bg-color: #0d0d1a;
          --dark-text-color: #f0f4f8;
          --dark-card-bg-color: #1a1a2e;
          --dark-border-color: #33334d;
          --dark-primary-color: #7b43a9;
          --dark-secondary-color: #5d2879;
          --dark-tertiary-color: #f72585;
          --dark-accent-color: #4cc9f0;
          --dark-gradient-start: #7b43a9;
          --dark-gradient-end: #3f1966;
          --dark-brand-color: #a78bfa; /* Softer purple for brand */

          --light-bg-color: #e9ecf2;
          --light-text-color: #2c3e50;
          --light-card-bg-color: #ffffff;
          --light-border-color: #e1e8ed;
          --light-primary-color: #4a2168;
          --light-secondary-color: #5c3584;
          --light-tertiary-color: #f72585;
          --light-accent-color: #3a86ff;
          --light-gradient-start: #4a2168;
          --light-gradient-end: #6c328e;
          --light-brand-color: #7e22ce; /* Deeper purple for brand */

          --font-family: 'Inter', sans-serif;
        }

        /* --- Base & Utility Classes --- */
        .app-container {
          min-height: 100vh;
          font-family: var(--font-family);
          transition: background-color 0.5s ease-in-out;
          padding: 2rem 1rem;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .dark-mode {
          background-color: var(--dark-bg-color);
          color: var(--dark-text-color);
        }

        .light-mode {
          background-color: var(--light-bg-color);
          color: var(--light-text-color);
        }

        .main-content-wrapper {
          max-width: 80rem;
          width: 100%;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
        }

        .icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        /* --- Header & Theme Toggle --- */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4rem;
          animation: fadeIn 1s ease-out;
        }

        .app-title {
          font-size: 1.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          letter-spacing: -0.05em;
        }

        .theme-toggle-btn {
          padding: 0.6rem;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .dark-mode .theme-toggle-btn {
          background-color: var(--dark-card-bg-color);
          color: var(--dark-accent-color);
        }

        .light-mode .theme-toggle-btn {
          background-color: var(--light-card-bg-color);
          color: var(--light-accent-color);
        }

        .theme-toggle-btn:hover {
          transform: scale(1.1);
        }

        /* --- Hero Section --- */
        .hero-section {
          text-align: center;
          padding: 2.5rem 0;
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.05em;
          background-image: linear-gradient(to right, var(--dark-primary-color), var(--dark-tertiary-color));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .light-mode .hero-title {
          background-image: linear-gradient(to right, var(--light-primary-color), var(--light-tertiary-color));
        }

        .hero-subtitle {
          font-size: 1.125rem;
          max-width: 48rem;
          margin: 0 auto 2rem;
          opacity: 0.8;
        }

        .input-form {
          max-width: 48rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: slideInUp 0.8s ease-out;
        }

        .input-container {
          display: flex;
          width: 100%;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border: 1px solid var(--dark-border-color);
          transition: border-color 0.3s;
        }
        .light-mode .input-container {
           border: 1px solid var(--light-border-color);
        }

        .input-container:focus-within {
          box-shadow: 0 0 0 3px var(--dark-primary-color);
        }
        .light-mode .input-container:focus-within {
           box-shadow: 0 0 0 3px var(--light-primary-color);
        }

        .input-field {
          flex: 1;
          padding: 0.8rem 1.25rem;
          border: none;
          outline: none;
          background-color: transparent;
          color: var(--dark-text-color);
          font-size: 1rem;
        }
        .light-mode .input-field {
            color: var(--light-text-color);
        }

        .input-field::placeholder {
          color: var(--dark-text-color);
          opacity: 0.6;
        }
        .light-mode .input-field::placeholder {
            color: var(--light-text-color);
        }

        .submit-btn {
          padding: 0.8rem 2rem;
          border: none;
          font-weight: 600;
          cursor: pointer;
          background-color: var(--dark-primary-color);
          color: #fff;
          transition: all 0.3s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .light-mode .submit-btn {
            background-color: var(--light-primary-color);
        }

        .submit-btn:hover:not(:disabled) {
          background-color: var(--dark-secondary-color);
          transform: scale(1.05);
        }
        .light-mode .submit-btn:hover:not(:disabled) {
           background-color: var(--light-secondary-color);
        }

        .submit-btn.disabled {
          background-color: var(--dark-border-color);
          cursor: not-allowed;
          opacity: 0.7;
        }
        .light-mode .submit-btn.disabled {
           background-color: var(--light-border-color);
        }


        /* --- Loading & Messages --- */
        .loader-message-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
          animation: fadeIn 0.8s ease-out;
        }

        .sparkle-spinner {
          width: 3rem;
          height: 3rem;
          color: var(--dark-accent-color);
          animation: spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .loader-message-container p {
            margin-top: 1rem;
            font-size: 1rem;
        }

        .message-card {
          padding: 1.5rem;
          border-radius: 1rem;
          margin-top: 2rem;
          text-align: center;
          animation: fadeIn 0.8s ease-out;
        }

        .dark-mode .message-card {
          background-color: var(--dark-card-bg-color);
          border: 1px solid var(--dark-border-color);
        }

        .light-mode .message-card {
          background-color: var(--light-card-bg-color);
          border: 1px solid var(--light-border-color);
        }

        .error-message {
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }

        /* --- Results Section --- */
        .results-section {
          padding-top: 2rem;
          animation: fadeIn 1s ease-out;
        }

        /* --- Export Button --- */
        .export-container {
          margin-top: 2rem; /* Increased margin */
          display: flex;
          justify-content: center;
        }

        .export-btn {
          padding: 0.8rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          color: white;
          border: none;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
          background-image: linear-gradient(to right, #16a34a, #059669);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .export-btn:disabled {
             opacity: 0.5;
             cursor: not-allowed;
             transform: none;
             box-shadow: none;
        }

        .export-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background-image: linear-gradient(to right, #15803d, #047857);
          box-shadow: 0 6px 10px -1px rgba(0,0,0,0.1);
        }

        .export-btn-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        /* --- End Export Button --- */


        /* --- Footer --- */
        .footer {
          padding: 2rem 0;
          text-align: center;
          font-size: 0.875rem;
          opacity: 0.7;
          animation: fadeIn 1s ease-in;
        }

        /* --- Animations --- */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinner { animation: spin 1s linear infinite; }

        .sparkle-spinner {
            animation: spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        `}</style>
    </div>
  );
}