# Installation and Initialization

To start the server:

1 - Run `npm install` (if you haven't already)
2 - Run `tsc && node dist/server.js`

# Documentation

The node backend expects inputs of the form defined as `NodeAPIRequestSchema` in `utils/PropertyDefinition.ts`. Specifically:

{
    filepath: string,
    useStatefulTesting: boolean?,
    textAssertions: {
        [ TextPBTAssertionSchema | LabelPBTAssertionSchema ]
    }
}

`filepath`: the filepath of the React component to test
`useStatefulTesting`: whether or not to allow state transitions. If this is enabled, the solver will allow the precondition variables to change based on valid state transitions defined in the React component. If this is disabled, the assignments of the precondition variables will never change.
`textAssertions`: an array of **all** PBT assertions

**The naming can be confusing:** `textAssertions` should really just be `assertions`. These are all PBT assertions, regardless of type. The PBT assertions must be defined in `PropertyDefinition.ts`, and their handles must be defined in `testComponentProperties.ts`. The types are inferred dynamically using the `canHandle` method. The base interface for an assertion is:

{
    name: string,
    lhs: Literal[][],
    rhs: Literal[][]
}

where a Literal is:

{
    name: string,
    assignment: boolean
}

`lhs`: an array of literals representing the CNF form of the precondition assignments. For instance, if I want to assert that `isLoading` => `hasLoadingTextOnPage`, the LHS would be [[{"isLoading": true}]].
`rhs`: an array of literals representing the CNF of right-hand side of the implication. In the above example, it would be [[{"hasLoadingText": true}]]. **As of now, this can ONLY either be the `name` field of the assertion assigned to either true or false**. Although we used CNF to allow for future extensibility, **this is a major limitation of the current system, and using other variables in this field is largely undefined behavior.**

# Parsing

The parsing is done in `utils/testComponentProperties`. This is the bulk of the logic for the server. The `content` of each branch is passed into the `AssertionHandler`. The function takes in the `filepath` and the PBT assertions from the server. It then returns a valid input for the Z3 server, which is reshaped in `server.ts`.

**A note on stateful testing:** when `useStatefulTesting` is disabled, the server simply sets all the transition arrays to `[]`. This is semantically equivalent, as testing the component with no valid transitions will prevent any state change from the initial. To read more about the Z3 server and what it expects, check the component-level README.