"use client";
import { useState } from "react";
import { Sun, Moon, Utensils, ShoppingCart, Loader, Sparkles, List, Calendar } from "lucide-react";
import confetti from 'canvas-confetti';

// --- Define Types for the Different AI Response Structures ---

// Type for a single item in the simple grocery list
interface GroceryItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

// Type for the simple grocery list response
interface ShoppingListResponse {
  grocery_list: GroceryItem[];
  total_price: number;
  message?: string;
}

// Type for a meal item within the old meal plan
interface MealItem {
  item: string;
  price: number;
}

// Type for a day's plan within the old meal plan
interface DailyPlan {
  lunch: string;
  dinner: string;
  snack: string;
}

// Type for the detailed old meal plan response
interface MealPlanResponse {
  meal_plan: {
    [day: string]: DailyPlan;
  };
  grocery_list: MealItem[];
  total_estimated_cost: number;
  message?: string;
}

// --- Updated Type for the NEW AI Response Structure ---
interface NewMealPlanStructure {
  meal_plan: {
    grocery_list?: { // Make it optional
      item: string;
      price: number;
      protein: number;
      carbs: number;
      fat: number;
      volume: string;
      unit: string; // Or number if it's a quantity like "1 st"
    }[];
    daily_meals?: { // Make it optional
      [day: string]: {
        meal1: string;
        meal2: string;
        snack: string;
      };
    };
    notes?: string; // Make it optional
  };
}
// --- End of Updated Type Definitions ---

// Type for the older success/error structure (fallback)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface OldApiResponse {
  success?: boolean;
  message?: string;
  plan_by_day?: unknown;
  plan?: unknown[];
  totals?: unknown;
  budgetIncrease?: number;
  weekly_totals?: unknown;
  shopping_list?: unknown[];
}

// Union type for all possible response structures
type ApiResponse = ShoppingListResponse | MealPlanResponse | NewMealPlanStructure | OldApiResponse | null;

// Type Guard Functions
function isShoppingListResponse(response: ApiResponse): response is ShoppingListResponse {
  return response !== null && 'grocery_list' in response && Array.isArray(response.grocery_list) && 'total_price' in response;
}

function isMealPlanResponse(response: ApiResponse): response is MealPlanResponse {
  return response !== null && 'meal_plan' in response && 'grocery_list' in response && 'total_estimated_cost' in response;
}

function isOldApiResponse(response: ApiResponse): response is OldApiResponse {
  return response !== null && ('success' in response || 'plan_by_day' in response || 'plan' in response || 'shopping_list' in response);
}

// Update Type Guard Function for the new structure
function isNewMealPlanStructure(response: ApiResponse): response is NewMealPlanStructure {
  return response !== null && 'meal_plan' in response && typeof response.meal_plan === 'object' && response.meal_plan !== null;
}
// --- End of Type Definitions ---

export default function App() {
  const [input, setInput] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse>(null);
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
    setResponse(null);
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

      const data = await res.json();
      console.log("Raw API Response:", data);

      let parsedAiData: ApiResponse = null;

      // --- Robust Parsing Logic for Markdown-Wrapped JSON ---
      if (data.answer) {
        const answerString = data.answer.trim();
        try {
          parsedAiData = JSON.parse(answerString);
        } catch (parseErrorDirect) {
          const codeBlockMatch = answerString.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
          if (codeBlockMatch && codeBlockMatch[1]) {
            try {
              parsedAiData = JSON.parse(codeBlockMatch[1]);
            } catch (extractParseError) {
              console.error("Failed to parse extracted JSON:", extractParseError);
              setError("Received response format was not usable (failed to parse extracted JSON).");
              setBusy(false);
              return;
            }
          } else {
            console.error("AI response is not valid JSON and not in a standard markdown code block:", answerString);
            setError("AI response format not recognized (not JSON, not markdown).");
            setBusy(false);
            return;
          }
        }
      } else {
        if (data && typeof data === 'object') {
           console.warn("API response did not have an 'answer' field, using the root data object.");
           parsedAiData = data as ApiResponse;
        } else {
           console.error("API response format unexpected.", data);
           setError("Unexpected API response format.");
           setBusy(false);
           return;
        }
      }

      console.log("Parsed AI Data (usable for UI):", parsedAiData);

      if (parsedAiData) {
        setResponse(parsedAiData);
        // Trigger confetti if it's a successful response of any new type
        if (isShoppingListResponse(parsedAiData) || isMealPlanResponse(parsedAiData) || isNewMealPlanStructure(parsedAiData)) {
           confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
           });
        }
        // Or if it's the old success message
        else if (isOldApiResponse(parsedAiData) && parsedAiData.success) {
           confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
           });
        }
      } else {
        setError("Could not process the AI response into a usable format.");
      }
    } catch (err) {
      console.error("Frontend Fetch Error:", err);
      setError("❌ Failed to connect to the server or process the response. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // --- Updated Export Function for All Structures ---
  function exportShoppingList() {
    if (!response) return;

    let lines: string[] = [];
    let filename = "your-plan.txt";

    if (isShoppingListResponse(response)) {
        lines = [
            "🛒 Your AI-Generated Grocery List",
            "=================================",
            "",
        ];
        response.grocery_list.forEach(item => {
             lines.push(`• ${item.name}`);
             lines.push(`   Quantity: ${item.quantity} x ${item.unit}`);
             lines.push(`   Price: ${item.price} kr`);
             lines.push(""); // Blank line for spacing
        });
        lines.push("📊 Totals:");
        lines.push(`Total Price: ${response.total_price} kr`);
        if (response.message) {
            lines.push("");
            lines.push(`📝 Notes: ${response.message}`);
        }
        filename = "your-grocery-list.txt";

    } else if (isMealPlanResponse(response)) {
        lines = [
            "🗓️ Your AI-Generated Weekly Meal Plan & Grocery List",
            "=====================================================",
            "",
        ];

        // --- Export Meal Plan ---
        lines.push("🍽️ Weekly Meal Plan:");
        Object.entries(response.meal_plan).forEach(([day, meals]) => {
             lines.push(``);
             lines.push(`${day}:`);
             lines.push(`  Lunch: ${meals.lunch}`);
             lines.push(`  Dinner: ${meals.dinner}`);
             lines.push(`  Snack: ${meals.snack}`);
        });

        // --- Export Grocery List ---
        lines.push("");
        lines.push("🛒 Grocery List:");
        response.grocery_list.forEach(item => {
             lines.push(`• ${item.item} (${item.price} kr)`);
        });
        lines.push("");
        lines.push("📊 Totals:");
        lines.push(`Estimated Total Cost: ${response.total_estimated_cost} kr`);
        if (response.message) {
            lines.push("");
            lines.push(`📝 Notes: ${response.message}`);
        }
        filename = "your-meal-plan.txt";

    } else if (isNewMealPlanStructure(response)) {
        lines = [
            "🗓️ Your AI-Generated Weekly Meal Plan",
            "=====================================",
            "",
        ];

        // --- Export Grocery List ---
        if (response.meal_plan.grocery_list && response.meal_plan.grocery_list.length > 0) {
            lines.push("🛒 Grocery List:");
            response.meal_plan.grocery_list.forEach(item => {
                lines.push(`• ${item.item}`);
                lines.push(`   Estimated Price: ${item.price} kr`);
                lines.push(`   Nutrition (per 100g): Protein ${item.protein}g, Carbs ${item.carbs}g, Fat ${item.fat}g`);
                lines.push(`   Typical Volume: ${item.volume}`);
                lines.push(`   Unit: ${item.unit}`);
                lines.push(""); // Blank line for spacing
            });
        } else {
            lines.push("🛒 Grocery List: Not provided by the AI.");
            lines.push("");
        }

        // --- Export Daily Meals ---
        if (response.meal_plan.daily_meals && Object.keys(response.meal_plan.daily_meals).length > 0) {
            lines.push("🍽️ Daily Meal Ideas:");
            Object.entries(response.meal_plan.daily_meals).forEach(([day, meals]) => {
                lines.push(``);
                lines.push(`${day}:`);
                lines.push(`  Meal 1: ${meals.meal1}`);
                lines.push(`  Meal 2: ${meals.meal2}`);
                lines.push(`  Snack: ${meals.snack}`);
            });
        } else {
            lines.push("🍽️ Daily Meal Ideas: Not provided by the AI.");
            lines.push("");
        }

        // --- Export Notes ---
        if (response.meal_plan.notes) {
            lines.push("");
            lines.push("📝 Notes from the AI:");
            lines.push(response.meal_plan.notes);
        }
        filename = "your-new-meal-plan.txt";

    } else {
        // Fallback to old export logic if old structure is somehow present
        console.warn("Export function called but response is not in a recognized new format.");
        lines = [
          "⚠️ Export format not available for this response.",
          "Please generate a new list or meal plan."
        ];
        filename = "export-error.txt";
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  // --- End of Updated Export Function ---

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
        {response && !busy && (
          <section className="results-section">
            {/* --- Dynamic Rendering Based on Response Type --- */}
            {isShoppingListResponse(response) && (
              <>
                <h2 className="results-title"><List className="icon" /> Your Grocery List</h2>
                <div className="shopping-list-grid">
                  {response.grocery_list.map((item, index) => (
                    <div key={index} className="shopping-item-card">
                      <h3 className="shopping-item-title">{item.name}</h3>
                      <div className="shopping-item-details">
                        <p><strong>Quantity:</strong> {item.quantity} x {item.unit}</p>
                        <p><strong>Price:</strong> {item.price} kr</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="totals-card">
                  <h3 className="totals-title">💰 Total Cost</h3>
                  <div className="totals-grid">
                    <div className="totals-item">
                      <p>Total</p>
                      <p>{response.total_price} kr</p>
                    </div>
                  </div>
                  {response.message && (
                    <div className="notes-section">
                      <p><strong>📝 Notes:</strong> {response.message}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {isMealPlanResponse(response) && (
              <>
                <h2 className="results-title"><Calendar className="icon" /> Your Weekly Meal Plan</h2>

                {/* --- Render Meal Plan --- */}
                <div className="meal-plan-grid">
                  {Object.entries(response.meal_plan).map(([day, meals]) => (
                    <div key={day} className="day-card">
                      <h3 className="day-title">{day}</h3>
                      <div className="meal-plan-details">
                        <p><strong>Lunch:</strong> {meals.lunch}</p>
                        <p><strong>Dinner:</strong> {meals.dinner}</p>
                        <p><strong>Snack:</strong> {meals.snack}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- Render Grocery List for Meal Plan --- */}
                <h3 className="sub-results-title">🛒 Grocery List for the Week</h3>
                <div className="shopping-list-grid">
                  {response.grocery_list.map((item, index) => (
                    <div key={index} className="shopping-item-card">
                      <h3 className="shopping-item-title">{item.item}</h3>
                      <div className="shopping-item-details">
                        <p><strong>Price:</strong> {item.price} kr</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="totals-card">
                  <h3 className="totals-title">💰 Estimated Total Cost</h3>
                  <div className="totals-grid">
                    <div className="totals-item">
                      <p>Total</p>
                      <p>{response.total_estimated_cost} kr</p>
                    </div>
                  </div>
                  {response.message && (
                    <div className="notes-section">
                      <p><strong>📝 Notes:</strong> {response.message}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- Rendering for the NEW AI Structure --- */}
            {isNewMealPlanStructure(response) && (
              <>
                <h2 className="results-title"><Calendar className="icon" /> Your Weekly Meal Plan</h2>

                {/* --- Conditionally Render Grocery List --- */}
                {response.meal_plan.grocery_list && response.meal_plan.grocery_list.length > 0 ? (
                  <>
                    <h3 className="sub-results-title">🛒 Grocery List for the Week</h3>
                    <div className="shopping-list-grid">
                      {response.meal_plan.grocery_list.map((item, index) => (
                        <div key={index} className="shopping-item-card">
                          <h3 className="shopping-item-title">{item.item}</h3>
                          <div className="shopping-item-details">
                            <p><strong>Estimated Price:</strong> {item.price} kr</p>
                            <p><strong>Protein:</strong> {item.protein}g per 100g</p>
                            <p><strong>Carbs:</strong> {item.carbs}g per 100g</p>
                            <p><strong>Fat:</strong> {item.fat}g per 100g</p>
                            <p><strong>Typical Volume:</strong> {item.volume}</p>
                            <p><strong>Unit:</strong> {item.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="message-card">No grocery list provided by the AI.</p>
                )}

                {/* --- Conditionally Render Daily Meals --- */}
                {response.meal_plan.daily_meals && Object.keys(response.meal_plan.daily_meals).length > 0 ? (
                  <>
                    <h3 className="sub-results-title">🍽️ Daily Meal Ideas</h3>
                    <div className="meal-plan-grid">
                      {Object.entries(response.meal_plan.daily_meals).map(([day, meals]) => (
                        <div key={day} className="day-card">
                          <h3 className="day-title">{day}</h3>
                          <div className="meal-plan-details">
                            <p><strong>Meal 1:</strong> {meals.meal1}</p>
                            <p><strong>Meal 2:</strong> {meals.meal2}</p>
                            <p><strong>Snack:</strong> {meals.snack}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="message-card">No daily meal plan provided by the AI.</p>
                )}

                {/* --- Conditionally Render Notes --- */}
                {response.meal_plan.notes && (
                  <div className="totals-card">
                    <h3 className="totals-title">📝 Notes from the AI</h3>
                    <div className="notes-section">
                      <p>{response.meal_plan.notes}</p>
                    </div>
                  </div>
                )}

                {/* --- Export Button for New Structure --- */}
                <div className="export-container">
                  <button
                    onClick={exportShoppingList}
                    className="export-btn"
                  >
                    <span className="export-btn-content">
                      <ShoppingCart className="icon" /> Export Plan
                    </span>
                  </button>
                </div>
              </>
            )}
            {/* --- End Rendering for the NEW AI Structure --- */}

            {/* --- Fallback for Old Structure or Errors --- */}
            {isOldApiResponse(response) && (
              <>
                <h2 className="results-title">
                  {response.message ? response.message : (response.success === false ? "Unable to Generate Plan" : "Generated Plan")}
                </h2>

                {response.success ? (
                  <>
                    <p className="message-card">Old response structure detected. Please use the previous version of the UI or update the AI prompt.</p>
                  </>
                ) : (
                  <div className="message-card error-message">
                    <p>{response.message || "An unknown error occurred."}</p>
                    {response.budgetIncrease && (
                      <p className="suggestion">
                        💡 <strong>Suggestion:</strong> Increase your budget by{" "}
                        <strong>{response.budgetIncrease.toFixed(2)} kr</strong> to meet your goal.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* --- Export Button for Old Structures (if needed) --- */}
            {/* Shown for old structures or new ones if not handled above */}
            {(isShoppingListResponse(response) || isMealPlanResponse(response)) && (
              <div className="export-container">
                <button
                  onClick={exportShoppingList}
                  className="export-btn"
                >
                  <span className="export-btn-content">
                    <ShoppingCart className="icon" /> Export List/Plan
                  </span>
                </button>
              </div>
            )}
            {/* --- End Export Button for Old Structures --- */}

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

        .results-title, .sub-results-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .sub-results-title {
           font-size: 1.5rem;
           margin-top: 2rem;
           margin-bottom: 1rem;
        }

        /* --- Shopping List Grid (Reused for both types) --- */
        .shopping-list-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .shopping-list-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
        }

        .shopping-item-card {
          padding: 1.25rem;
          border-radius: 0.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid var(--dark-border-color);
          transition: transform 0.3s, box-shadow 0.3s;
          position: relative;
          background-color: var(--dark-card-bg-color);
        }

        .light-mode .shopping-item-card {
          background-color: var(--light-card-bg-color);
          border: 1px solid var(--light-border-color);
        }

        .shopping-item-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.15);
        }

        .shopping-item-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--dark-accent-color);
        }
        .light-mode .shopping-item-title {
           color: var(--light-accent-color);
        }

        .shopping-item-details {
          font-size: 0.875rem;
        }

        .shopping-item-details > p {
           margin: 0.25rem 0;
        }
        /* --- End Shopping List Grid --- */


        /* --- Meal Plan Grid --- */
        .meal-plan-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .meal-plan-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }

        .day-card {
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            border: 1px solid var(--dark-border-color);
            transition: transform 0.3s, box-shadow 0.3s;
            background-color: var(--dark-card-bg-color);
        }
        .light-mode .day-card {
          background-color: var(--light-card-bg-color);
          border: 1px solid var(--light-border-color);
        }
         .day-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .day-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.25rem;
            text-align: center;
            position: relative;
            padding-bottom: 0.5rem;
            color: var(--dark-accent-color);
        }
        .light-mode .day-title {
           color: var(--light-accent-color);
        }
        .day-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background-color: var(--dark-primary-color);
        }
        .light-mode .day-title::after {
            background-color: var(--light-primary-color);
        }

        .meal-plan-details {
            font-size: 0.875rem;
        }
        .meal-plan-details > p {
           margin: 0.5rem 0;
        }
        /* --- End Meal Plan Grid --- */


        /* --- Budget Summary Card (Updated Totals Card) --- */
        .totals-card {
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid var(--dark-border-color);
          background-image: linear-gradient(45deg, var(--dark-gradient-start), var(--dark-gradient-end));
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          margin-bottom: 2rem;
        }
        .light-mode .totals-card {
           border: 1px solid var(--light-border-color);
           background-image: linear-gradient(45deg, var(--light-gradient-start), var(--light-gradient-end));
           box-shadow: 0 10px 20px rgba(0,0,0,0.1);
           color: #fff;
        }

        .totals-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .totals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .totals-item {
          padding: 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          transition: transform 0.3s;
        }
        .light-mode .totals-item {
             background: rgba(255, 255, 255, 0.2);
        }
        .totals-item:hover {
            transform: translateY(-5px);
        }

        .totals-item p:first-child {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 0.25rem;
        }

        .totals-item p:last-child {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .notes-section {
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-style: italic;
        }
        .light-mode .notes-section {
             border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .notes-section p {
            margin: 0;
        }
        /* --- End Budget Summary Card --- */


        /* --- Export Button --- */
        .export-container {
          margin-top: 1rem;
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