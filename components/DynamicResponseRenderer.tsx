// components/DynamicResponseRenderer.tsx
import { useState, useEffect, JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Calendar, List, ShoppingCart } from 'lucide-react'; // Adjust import path if needed

// --- Type Definitions ---
interface SimpleGroceryItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface SimpleGroceryListResponse {
  grocery_list: SimpleGroceryItem[];
  total_price: number;
  message?: string;
}

interface OldMealItem {
  item: string;
  price: number;
}

interface OldDailyPlan {
  lunch: string;
  dinner: string;
  snack: string;
}

interface OldMealPlanResponse {
  meal_plan: {
    [day: string]: OldDailyPlan;
  };
  grocery_list: OldMealItem[];
  total_estimated_cost: number;
  message?: string;
}

interface NewMealPlanGroceryItem {
  item: string;
  price: number;
  protein: number;
  carbs: number;
  fat: number;
  volume: string;
  quantity: string;
  unit: string;
  brand: string;
  link: string;
}

interface NewMealPlanResponse {
  meal_plan: {
    grocery_list?: NewMealPlanGroceryItem[];
    daily_meals?: {
      [day: string]: {
        meal1: string;
        meal2: string;
        snack: string;
      };
    };
    notes?: string;
  };
}

interface ErrorResponse {
  success?: boolean;
  message?: string;
  budgetIncrease?: number;
}

type ParsedApiResponse =
  | SimpleGroceryListResponse
  | OldMealPlanResponse
  | NewMealPlanResponse
  | ErrorResponse
  | null;

// --- Type Guards ---
function isSimpleGroceryList(data: any): data is SimpleGroceryListResponse {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.grocery_list) &&
    typeof data.total_price === 'number'
  );
}

function isOldMealPlan(data: any): data is OldMealPlanResponse {
  return (
    data &&
    typeof data === 'object' &&
    data.meal_plan &&
    typeof data.meal_plan === 'object' &&
    !data.meal_plan.grocery_list // Differentiate from new structure
  );
}

function isNewMealPlan(data: any): data is NewMealPlanResponse {
  return (
    data &&
    typeof data === 'object' &&
    data.meal_plan &&
    typeof data.meal_plan === 'object' &&
    (data.meal_plan.grocery_list !== undefined || data.meal_plan.daily_meals !== undefined)
  );
}

function isErrorResponse(data: any): data is ErrorResponse {
  // Check for explicit success false or just a message for errors
  return (
    data &&
    typeof data === 'object' &&
    (data.success === false || (typeof data.message === 'string' && !data.grocery_list && !data.meal_plan))
  );
}
// --- End of Type Definitions and Guards ---

// --- Rendering Components ---
const renderSimpleGroceryList = (data: SimpleGroceryListResponse) => (
  <div className="rendered-response-section">
    <h2 className="results-title-with-icon"><List className="icon" /> Your Grocery List</h2>
    <div className="shopping-list-grid">
      {data.grocery_list.map((item, index) => (
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
          <p>{data.total_price} kr</p>
        </div>
      </div>
      {data.message && (
        <div className="notes-section">
          <p><strong>📝 Notes:</strong> {data.message}</p>
        </div>
      )}
    </div>
  </div>
);

const renderOldMealPlan = (data: OldMealPlanResponse) => (
  <div className="rendered-response-section">
    <h2 className="results-title-with-icon"><Calendar className="icon" /> Your Weekly Meal Plan</h2>

    <div className="meal-plan-grid">
      {Object.entries(data.meal_plan).map(([day, meals]) => (
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

    <h3 className="sub-results-title">🛒 Grocery List for the Week</h3>
    <div className="shopping-list-grid">
      {data.grocery_list.map((item, index) => (
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
          <p>{data.total_estimated_cost} kr</p>
        </div>
      </div>
      {data.message && (
        <div className="notes-section">
          <p><strong>📝 Notes:</strong> {data.message}</p>
        </div>
      )}
    </div>
  </div>
);

const renderNewMealPlan = (data: NewMealPlanResponse) => {
  const groceryList = data.meal_plan.grocery_list || [];
  const dailyMeals = data.meal_plan.daily_meals || {};
  const notes = data.meal_plan.notes;

  return (
    <div className="rendered-response-section">
      <h2 className="results-title-with-icon"><Calendar className="icon" /> Your Weekly Meal Plan</h2>

      {groceryList.length > 0 ? (
        <>
          <h3 className="sub-results-title">🛒 Grocery List for the Week</h3>
          <div className="shopping-list-grid">
            {groceryList.map((item, index) => (
              <div key={index} className="shopping-item-card">
                <div className="brand-badge">{item.brand}</div>
                <h3 className="shopping-item-title">{item.item}</h3>
                <div className="shopping-item-details">
                  <p><strong>Needed Quantity:</strong> {item.quantity} x {item.unit}</p>
                  <p><strong>Estimated Price:</strong> {item.price} kr</p>
                  <p><strong>Protein:</strong> {item.protein}g per 100g</p>
                  <p><strong>Carbs:</strong> {item.carbs}g per 100g</p>
                  <p><strong>Fat:</strong> {item.fat}g per 100g</p>
                  <p><strong>Typical Volume:</strong> {item.volume}</p>
                </div>
                <a
                  href={item.link.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-product-link"
                >
                  <span>View Product</span>
                  <ExternalLink className="link-icon" />
                </a>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="message-card">No grocery list provided by the AI.</p>
      )}

      {Object.keys(dailyMeals).length > 0 ? (
        <>
          <h3 className="sub-results-title">🍽️ Daily Meal Ideas</h3>
          <div className="meal-plan-grid">
            {Object.entries(dailyMeals).map(([day, meals]) => (
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

      {notes && (
        <div className="totals-card">
          <h3 className="totals-title">📝 Notes from the AI</h3>
          <div className="notes-section">
            <p>{notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const renderErrorMessage = (data: ErrorResponse) => (
  <div className="rendered-response-section error-message">
    <h2 className="results-title">Unable to Generate Plan</h2>
    <p>{data.message || "An unknown error occurred."}</p>
    {data.budgetIncrease && (
      <p className="suggestion">
        💡 <strong>Suggestion:</strong> Increase your budget by{" "}
        <strong>{data.budgetIncrease.toFixed(2)} kr</strong> to meet your goal.
      </p>
    )}
  </div>
);

const renderUnknownStructure = (data: any) => (
  <div className="rendered-response-section">
    <h3>Unknown Response Structure</h3>
    <p>The AI returned valid JSON, but its structure is not recognized.</p>
    <details className="debug-details">
      <summary>Raw Parsed Data</summary>
      <pre className="debug-pre">{JSON.stringify(data, null, 2)}</pre>
    </details>
  </div>
);

const renderRawResponse = (rawAnswer: string) => (
  <div className="rendered-response-section">
    <h3>AI Response (Text)</h3>
    {/* Use ReactMarkdown to render the raw text as Markdown */}
    <div className="markdown-content">
      <ReactMarkdown
        // Add remark plugins for extra features like gfm (tables, strikethrough) if needed
        // remarkPlugins={[remarkGfm]}
        // Add rehype plugins for sanitization if needed for security
        // rehypePlugins={[rehypeSanitize]}
        components={{
          // Customize rendering of specific elements if needed
          // Example: Add target="_blank" to links
          // a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />,
        }}
      >
        {rawAnswer}
      </ReactMarkdown>
    </div>
  </div>
);
// --- End of Rendering Components ---

export default function DynamicResponseRenderer({ rawAnswer }: { rawAnswer: string }) {
  const [contentToDisplay, setContentToDisplay] = useState<JSX.Element | null>(null);
  const [isParsedSuccessfully, setIsParsedSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    if (!rawAnswer) {
      setContentToDisplay(<p className="awaiting-response">Awaiting AI response...</p>);
      setIsParsedSuccessfully(false);
      return;
    }

    let dataToParse = rawAnswer.trim();
    let parsedObject: ParsedApiResponse = null;

    // 1. Try to extract JSON from markdown code block
    const codeBlockMatch = dataToParse.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      dataToParse = codeBlockMatch[1];
    }

    // 2. Try to parse the JSON string
    try {
      parsedObject = JSON.parse(dataToParse);
      setIsParsedSuccessfully(true);

      // 3. Analyze structure and render accordingly
      let renderedContent: JSX.Element | null = null;
      if (isSimpleGroceryList(parsedObject)) {
        renderedContent = renderSimpleGroceryList(parsedObject);
      } else if (isNewMealPlan(parsedObject)) {
        renderedContent = renderNewMealPlan(parsedObject);
      } else if (isOldMealPlan(parsedObject)) {
        renderedContent = renderOldMealPlan(parsedObject);
      } else if (isErrorResponse(parsedObject)) {
        renderedContent = renderErrorMessage(parsedObject);
      } else {
        renderedContent = renderUnknownStructure(parsedObject);
      }
      setContentToDisplay(renderedContent);
    } catch (err: any) {
      // 4. If parsing fails, display the raw text WITH Markdown support
      console.warn("Failed to parse AI response JSON, displaying raw text with Markdown:", err);
      setIsParsedSuccessfully(false);
      setContentToDisplay(renderRawResponse(rawAnswer));
    }
  }, [rawAnswer]);

  return (
    <div className="dynamic-response-container">
      {contentToDisplay}
    </div>
  );
}

// --- Embedded Styles ---
const styles = `
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

  /* --- Dynamic Response Container --- */
  .dynamic-response-container {
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-top: 1.5rem;
    background-color: var(--dark-card-bg-color); /* Default dark */
    color: var(--dark-text-color); /* Default dark text */
    border: 1px solid var(--dark-border-color);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
  .light-mode .dynamic-response-container {
    background-color: var(--light-card-bg-color);
    color: var(--light-text-color);
    border: 1px solid var(--light-border-color);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }

  .awaiting-response {
    text-align: center;
    font-style: italic;
    opacity: 0.7;
  }

  /* --- Rendered Response Section (Copied relevant styles) --- */
  .rendered-response-section {
    animation: fadeIn 0.8s ease-out;
  }

  .results-title-with-icon, .sub-results-title {
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

  /* --- Shopping List Grid --- */
  .shopping-list-grid {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  @media (min-width: 768px) {
    .shopping-list-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
    display: flex;
    flex-direction: column;
  }
  .light-mode .shopping-item-card {
    background-color: var(--light-card-bg-color);
    border: 1px solid var(--light-border-color);
  }
  .shopping-item-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.15);
  }

  .brand-badge {
    align-self: flex-start;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px; /* Fully rounded */
    font-size: 0.75rem;
    font-weight: 600;
    background-color: var(--dark-brand-color);
    color: white;
    margin-bottom: 0.5rem;
  }
  .light-mode .brand-badge {
    background-color: var(--light-brand-color);
    color: white;
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
    flex-grow: 1; /* Pushes the link button to the bottom */
  }
  .shopping-item-details > p {
     margin: 0.25rem 0;
  }

  /* --- View Product Link --- */
  .view-product-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background-color: var(--dark-primary-color);
      color: white;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: background-color 0.2s;
      align-self: flex-start; /* Align button to the left */
  }
  .light-mode .view-product-link {
      background-color: var(--light-primary-color);
  }
  .view-product-link:hover {
      background-color: var(--dark-secondary-color);
  }
  .light-mode .view-product-link:hover {
      background-color: var(--light-secondary-color);
  }
  .link-icon {
      width: 1rem;
      height: 1rem;
  }
  /* --- End View Product Link --- */
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


  /* --- Budget Summary Card --- */
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


  /* --- Message Card (Error/Info) --- */
  .message-card {
    padding: 1.5rem;
    border-radius: 1rem;
    margin-top: 2rem;
    text-align: center;
    animation: fadeIn 0.8s ease-out;
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
  .dark-mode .error-message {
    border-color: #b91c1c;
    background-color: rgba(127, 29, 29, 0.3);
  }
  .suggestion {
    margin-top: 0.75rem;
    font-size: 0.875rem;
  }
  /* --- End Message Card --- */


  /* --- Raw Text Response with Markdown Support --- */
  .raw-text-response h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--dark-accent-color); /* Default */
  }
  .light-mode .raw-text-response h3 {
    color: var(--light-accent-color);
  }

  /* Basic styling for rendered Markdown elements */
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    line-height: 1.25;
  }
  .markdown-content h1 {
    font-size: 2rem;
  }
  .markdown-content h2 {
    font-size: 1.75rem;
  }
  .markdown-content h3 {
    font-size: 1.5rem;
  }
  .markdown-content h4 {
    font-size: 1.25rem;
  }
  .markdown-content h5 {
    font-size: 1.125rem;
  }
  .markdown-content h6 {
    font-size: 1rem;
  }

  .markdown-content p {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .markdown-content ul,
  .markdown-content ol {
    margin-top: 0;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .markdown-content li {
    margin-bottom: 0.25rem;
  }

  .markdown-content a {
    color: var(--dark-accent-color); /* Default */
    text-decoration: underline;
  }
  .light-mode .markdown-content a {
    color: var(--light-accent-color);
  }
  .markdown-content a:hover {
    opacity: 0.8;
  }

  .markdown-content pre {
    background-color: #1e293b; /* Default dark */
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    margin-top: 0;
    margin-bottom: 1rem;
  }
  .light-mode .markdown-content pre {
    background-color: #f1f5f9; /* Default light */
  }

  .markdown-content code {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    background-color: rgba(156, 163, 175, 0.2); /* Default gray/200 */
  }
  .light-mode .markdown-content code {
    background-color: rgba(209, 213, 219, 0.5); /* Default gray/300 */
  }

  .markdown-content blockquote {
    margin: 0 0 1rem;
    padding: 0 1rem;
    border-left: 4px solid var(--dark-border-color); /* Default */
    color: var(--dark-text-color); /* Default */
    opacity: 0.8;
  }
  .light-mode .markdown-content blockquote {
    border-left-color: var(--light-border-color);
    color: var(--light-text-color);
  }

  .markdown-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
    margin: 1rem 0;
  }

  .markdown-content hr {
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid var(--dark-border-color); /* Default */
  }
  .light-mode .markdown-content hr {
    border-top-color: var(--light-border-color);
  }

  .markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  .markdown-content th,
  .markdown-content td {
    padding: 0.5rem;
    border: 1px solid var(--dark-border-color); /* Default */
    text-align: left;
  }
  .light-mode .markdown-content th,
  .light-mode .markdown-content td {
    border-color: var(--light-border-color);
  }

  .markdown-content th {
    background-color: rgba(156, 163, 175, 0.1); /* Default gray/100 */
    font-weight: 600;
  }
  .light-mode .markdown-content th {
    background-color: rgba(209, 213, 219, 0.3); /* Default gray/200 */
  }
  /* --- End Raw Text Response with Markdown Support --- */


  /* --- Debug Details --- */
  .debug-details {
    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px dashed #cbd5e1;
    border-radius: 0.375rem;
  }
  .dark-mode .debug-details {
    border-color: #475569;
  }
  .debug-pre {
     background-color: #1e293b;
     padding: 0.5rem;
     border-radius: 0.25rem;
     overflow-x: auto;
     font-size: 0.75rem;
  }
  .dark-mode .debug-pre {
     background-color: #1e293b;
  }
  /* --- End Debug Details --- */

  /* --- Animations --- */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  /* --- End Animations --- */
`;

// Inject styles if not already present (basic check)
if (typeof document !== 'undefined' && !document.getElementById('dynamic-response-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-response-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}
// --- End of Embedded Styles ---