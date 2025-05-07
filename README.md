# PBT for Stateful React

## Authors

Henry Earnest, Milo Kron, Erik Vank

## Motivation

Many real-world systems (such as web applications and databases) use some notion of state. tMethods for property-based testing on stateful liraries currently remain limited. Since React is a common web framework used for many services, we decided to use a subset of React.

## Design Tradeoffs

We wanted to make the design extensible while also limiting the scope adequately. 

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
