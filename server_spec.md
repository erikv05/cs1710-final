Request:

A few notes:
- When I use 'variable' generically, I mean state_variables union pbt_variables

{
    "state_variables": [String] of all state variables in the react component,
    "pbt_variables": [String] of all PBT variables that the user has defined. NOTE: The user will define the names of these variables *in the client* (they are arbitrary),
    "state_transitions": [
        {
            "lhs": (represents LHS of z3 implication)
            {
                [{String variableName: Bool assignment (maps variables to assignments. E.g. !loading would be "loading": "false")}, {"isConj": Bool}] - NOTE this is an array. isConj represents whether the operator to join the rest of the variables with is AND or OR.
            },
            "rhs": {
                [{String variableName: Bool assignment (same as before)}, {"isConj": "Bool"}] - NOTE this is an array
            }
        }
    ],

NOTE: Every variable will be separated with an isConj except the last one.

    "pbt_assertions": NOTE - this is NOT an array, since we will only ever test one assertion at a time with the server
        {
            "lhs":
            {
                [{String : Bool}, {isConj: Bool}]
            },
            "rhs": {
                [{String: Bool}, {isConj: Bool}]
            }
        }
}

Response:

{
    "passes_tests" : Bool,
    "violating_state" : [
        {"state_variable_name" String: assignment Bool}
    ], - Array of state variables that caused the violation
    "violated_pbt" : [
        {"pbt_variable_name" String: assignment Bool}
    ] - Array of PBT variables that were violated
}

Recommendations (pls read or I will be sad):

In terms of what we want from the z3 model, **[state_transitions and not pbt_assertions] is UNSAT means that the TESTS HAVE PASSED**. Alternatively, **[state_transitions and not pbt_assertions] is SAT means that the TESTS HAVE PASSED**. That's why I split up the state transitions and PBT assertions.

Intuitively, if all the state transition predicates hold (i.e., the React component is the same as the one the user has defined) AND there is a way to violate any of the PBT assertions, then the tests have failed (since the PBT assertions do not always hold true). To help the user understand why this is the case, we also want to return which of the PBT variables were violated (e.g. white background, no loading text, etc.) as this will help with the visualizer as well. This might be redundant but why not, we don't care about performance as the server will not be the bottleneck. We want to return the state variables to show the user __how__ the violation could occur.