# PBT for Stateful React

## Authors (alphabetically by last name)

Henry Earnest, Milo Kron, Erik Vank

## Motivation

Many real-world systems (such as web applications and databases) use some notion of state. tMethods for property-based testing on stateful liraries currently remain limited. Since React is a common web framework used for many services, we decided to use a subset of React.

## Design Tradeoffs

We wanted to make the design extensible while also limiting the scope adequately. Conforming to this requirement, the back-end is largely written in a way that would support additional operations in the future. For example, the rhs of PBT assertions are written in CNF even though they only support one literal as of now. Additionally, state transitions sent to the Z3 server contain an array of possible states, which would expand to types like strings and integers.

## Scope Assumptions

Limitations are listed under the "Node Backend" section. These limitations mostly cover the limitations of the frontend and the Z3 server as well.

## Goals

Generally, our goals stayed pretty consistent with our proposal. We didn't have time for a super pretty visualization, but achieved something close to Sterling in Forge. We also didn't have time for any real SMT functionality, but this was not an explicit goal either.

We were, however, able to make the project much more extensible as a whole than initially anticipated.

## Understanding the Model

Successful tests represent an instance where the Z3 solver was not able to find a satisfying assignment such that any one of the rhs of the PBT assertions were violated. Unsuccessful tests represent the opposite (i.e., an assignment that violates the PBT assertions). When state transitions are turned off, all the states in the visualization for failing tests will be the same (as they are internally represented with an empty array for transitions). When state transitions are turned on, each individual state is listed with an index at the beginning. All next states will represent either exactly one state transition or a noop.

# Components

## CSS/HTML Parsing

Contained in `css_parser/` and `html_parser/` are two JavaScript files that can:
1. Open and search css/html files by filepath
2. Search that a property is given a certain value, on any matching css class / id


HTML properties that can be checked include fields like `class`, `id`, and also `rawText`, for checking the internal text of an HTML element. To validate an HTML property, you can pass a css selector (either a class or id) and the function provided will determine 1. which it is, assuming that IDs and classes don't overlap and IDs are uniquely used, and 2. whether that property is ever given that value on any element matching the selector.


In CSS, you can pass a class name to the respective functions and they can parse the CSS filepath to check if a property is assigned a value for the given class.


These are not directly used in the TypeScript parsing server because we simplified the parsing behavior under the time constraints, but future expansion of possible property-based tests should use these functions to allow users to test arbitrary properties of HTML and CSS.

## Z3 Solver Backend

The backend uses Z3's boolean logic to determine whether or not there is a satisfying assignment for the React state variables such that the right-hand side of the PBT assertion is satisfied. For example, if a user specifies that `stateVar1 => PBTVar1`, Z3 will try to find an assignment for `ReactState - stateVar1` such that PBTVar1 is false. Additionally, the Z3 solver takes a `transitions` array that specifies valid React state transitions. It will attempt to find a satisfying assignment for the above while also allowing the state variables in the preconditions to change via the allowable state transitions.

The API specification for the backend (along with additional documentation) can be found in the component-level directory (z3_server/).

## Node Backend

The node backend is contained in `node_backend/`. It uses the ts-morph parser to extract relevant component information based on the user-specified property tests.

### Specification

The API specification can be found in the component-level README. Additional information about the structure of the backend can be found in the component-level README as well.

### Limitations

As of now, the Node backend has several major limitations:

(1) The left-hand side (preconditions) of all property-based tests must be written in CNF

(2) The right-hand side, although internally handled in CNF, must be either the name of the property-based test or its negation.

(3) State variables in React must be defined within the component using useState.

(4) JSX conditional rendering is not supported: the component must use if-else branches, and the conditions must only include state variables in CNF.

(5) Only TextPBTAssertion and LabelPBTAssertion are supported for property-based tests. The HTML and CSS parsers may be used to expand these in the future, and the code should be extensible (enough) to support new AssertionHandlers.

(6) Only boolean state variables are supported.

(7) For a state variable `stateVar`, state transitions must take the form of: setStateVar(true) | setStateVar(false) | setStateVar(!stateVar)

(8) There is limited input validation. Some of the validation we have built in includes:

- Checking that the PBT assertions are written in CNF (done in the client)
- Type safety for inputs using Zod
- Checking that state variables defined in the client actually exist in the React component, and returning a 400 if not
