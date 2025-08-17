
# 🛒  Grocery Planner AI

Get personalized, budget-conscious meal plans and shopping lists based on real products from Willys (a Swedish grocery store). This web application uses AI to analyze your dietary goals and suggest items from Willys' inventory.

## ✨ Features

*   **AI-Powered Planning**: Describe your goals (e.g., "140g protein, 80 kr/day, low-carb") and let the AI generate a plan.
*   **Flexible Output**: Handles various AI responses, including:
    *   Simple weekly grocery lists.
    *   Detailed weekly meal plans with grocery lists.
    *   Meal ideas and ingredient lists.
*   **Dynamic Rendering**: Automatically adapts the user interface based on the structure of the AI's response.
*   **Export Functionality**: Easily export your generated plan or list as a text file for shopping.
*   **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine or deployed online.

### Prerequisites

*   **Node.js** (version 18 or later recommended)
*   **npm** (comes with Node.js) or **yarn**
*   An **OpenAI API key** (if you are connecting to the AI backend)

### Installing

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rockerz109/grocery-rag.git
    cd grocery-rag
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or if you use yarn
    # yarn install
    ```
3.  **Set up environment variables (if connecting to backend):**
    Create a `.env.local` file in the root directory and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_openai_api_key_here
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
5.  **Open your browser:** Navigate to `http://localhost:3000` to see the application.

## 📁 Project Structure
```markdown
GROCERY-RAG/
├── .next/                      # Next.js build output
├── app/                        # Application routes & UI
├── data/                       # Local data (processed product info, test files)
├── node_modules/               # Dependencies
├── public/                     # Static assets
├── scripts/                    # Helper scripts (e.g., vector store seeding)
│   └── seed-vector-store.js
├── .env.local                  # Environment variables (ignored by git)
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint configuration
├── next-env.d.ts               # Next.js type definitions
├── next.config.ts              # Next.js configuration
├── package-lock.json           # Dependency lock file
├── package.json                # Project dependencies & scripts
├── README.md                   # Project documentation
├── test.json                   # Sample JSON data for testing
└── tsconfig.json               # TypeScript configuration
```
## 🧠 How It Works (Frontend)

1.  **User Input:** The user describes their dietary needs in the input box (e.g., protein goals, budget, preferences).
2.  **API Call:** The frontend sends this input to a backend API endpoint (e.g., `/api/ask`).
3.  **AI Processing (Backend):** The backend uses the input to query an AI model (like GPT) which has access to Willys product data.
4.  **Response Parsing:** The AI returns a structured JSON response. The frontend uses *type guards* to determine the exact structure of this response (e.g., simple list, detailed meal plan).
5.  **Dynamic Rendering:** Based on the identified structure, the frontend renders the appropriate UI components (cards for items, grids for days/meals).
6.  **Export:** Users can export the displayed plan or list to a `.txt` file.

## 🛠️ Seeding the Vector Store

The `scripts/seed-vector-store.js` script is used to process the raw CSV data files (like `willys_protein_price_kyckling.csv`) and convert them into a format suitable for the vector store. This script should be run once after adding new data to the `data/` folder.

To run the seeding script, execute:
```bash
node scripts/seed-vector-store.js
