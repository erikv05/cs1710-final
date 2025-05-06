# React Property-Based Testing Framework

This project provides a comprehensive property-based testing framework for React components. It consists of a Node.js backend server that tests React components against specified properties, and a React frontend that allows users to define and run these tests.

## Project Structure

The project is structured into two main parts:

1. **Backend Server** (`node_server/`) - A Node.js Express server that:
   - Takes React component filepaths and property assertions as input
   - Tests the components to see if they satisfy these assertions
   - Returns detailed test results

2. **Frontend** (`frontend/`) - A React application built with Vite and TypeScript that:
   - Provides a user interface for specifying component filepaths
   - Lets users define property-based test assertions
   - Displays test results in a clear, user-friendly format

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/react-property-based-testing.git
   cd react-property-based-testing
   ```

2. Install dependencies for both backend and frontend:
   ```
   # Install backend dependencies
   cd node_server
   npm install
   cd ..

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

1. Start the backend server:
   ```
   cd node_server
   npm start
   ```
   The server will run on http://localhost:3000

2. Start the frontend:
   ```
   cd frontend
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

## How Property-Based Testing Works

Property-based testing is a testing methodology that focuses on verifying that a component satisfies certain properties under specific conditions, rather than just testing specific inputs and outputs.

In our implementation:

1. **Test Assertions** define:
   - A condition (when a component is in a specific state)
   - An expected outcome or property that should hold true

2. **Conjunctive Normal Form (CNF)** is used to represent boolean logic expressions:
   - Conditions are expressed as a conjunction (AND) of clauses
   - Each clause is a disjunction (OR) of literals
   - A literal is a variable or its negation

For example, a test might verify that:
- When `isLoading` is true, the text "Loading..." appears
- When `isDarkMode` is true and not loading, a "Switch to Light Mode" button appears

## Features

- **TextPBTAssertion**: Test for the presence of specific text in a component
- Extensible architecture for adding more types of assertions (e.g., background color, visibility)
- Support for complex conditional assertions using CNF expressions
- Clean, intuitive UI for defining and running tests
- Dark/light mode support

## Future Enhancements

- Support for more assertion types (styles, element properties, etc.)
- Integration with test runners like Jest
- Test report generation and export
- Improved CNF expression editor with visual builder
- CI/CD integration

## License

This project is licensed under the MIT License - see the LICENSE file for details. 