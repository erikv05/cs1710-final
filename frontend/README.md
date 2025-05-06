# React Property-Based Testing Frontend

This is a frontend application for property-based testing in React components.

## Features

- Input a React component filepath for testing
- Define property-based test assertions
- Support for testing text presence in components based on state conditions
- Extensible architecture for adding more types of assertions

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Running the Application

1. Start the frontend:
   ```
   npm run dev
   ```
   This will start the development server at http://localhost:5173

2. Make sure the backend server is running at http://localhost:3000

## How to Use

1. **Enter the filepath for your React component** in the input field
2. **Add property-based test assertions** by clicking the "Add Assertion" button
3. For each assertion:
   - Provide a name for the assertion
   - Select the assertion type (e.g., TextPBTAssertion)
   - For TextPBTAssertion, enter the text to find in the component
   - Define the left-hand side conditions using CNF (Conjunctive Normal Form)
   - Define the right-hand side expected results
4. **Run the tests** by clicking the "Run Tests" button
5. View the results below

## Example

The example test checks a React component for:
- Presence of "Loading..." text when isLoading is true
- Presence of "Switch to Light Mode" button when isDarkMode is true and not loading
- Presence of "Switch to Dark Mode" button when isDarkMode is false and not loading

## Future Enhancements

- Support for additional types of assertions (background color, element visibility, etc.)
- Test scheduling and automation
- Integration with test runners like Jest
- Export/import of test configurations
