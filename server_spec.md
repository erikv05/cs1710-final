Request:

A few notes:
- When I use 'variable' generically, I mean state_variables union pbt_variables

{
    "state_variables": [String] of all state variables in the react component,
    "pbt_variables": [String] of all PBT variables that the user has defined. NOTE: The user will define the names of these variables *in the client* (they are arbitrary),
    "state_transitions": [
        {
            "lhs": (represents LHS of z3 implication) (conveyed in conjunctive normal form)
                [
                    [{String variableName: Bool assignment} (a variable in a cnf clause. Implicitly joined with an OR to the next variable) ...] (one clause of the cnf formula. implicitly joined with an AND to the next clause)
                    
                    ...
                ]
            ,
            "rhs": {
                [[{String variableName: Bool assignment}]] (same as lhs)
            }
        }
    ],

    "pbt_assertions": (same as state_transitions, but each assertion has a name)
        [ 
            {
                "assert_name" : String (used to identify failing asserts in the repsonse. these should be unique)
                "lhs":[[{String variableName: Bool assignment}]] 
                "rhs":[[{String variableName: Bool assignment}]]
            }
        ]
}

Response:

[ (list of failed property tests and their variable assignments. If everything passed, this should be empty)
    {
        "violated_pbt" : String (PBT assertion that was violated, identified by name. empty if passed)
        "violating_state" : [
            {"variable_name" String: assignment Bool}
        ],(Array of variables that caused the violation. empty if passed)
    }
]

Recommendations (pls read or I will be sad):

In terms of what we want from the z3 model, **[state_transitions and not pbt_assertions] is UNSAT means that the TESTS HAVE PASSED**. Alternatively, **[state_transitions and not pbt_assertions] is SAT means that the TESTS HAVE PASSED**. That's why I split up the state transitions and PBT assertions.

Intuitively, if all the state transition predicates hold (i.e., the React component is the same as the one the user has defined) AND there is a way to violate any of the PBT assertions, then the tests have failed (since the PBT assertions do not always hold true). To help the user understand why this is the case, we also want to return which of the PBT variables were violated (e.g. white background, no loading text, etc.) as this will help with the visualizer as well. This might be redundant but why not, we don't care about performance as the server will not be the bottleneck. We want to return the state variables to show the user __how__ the violation could occur.


MILO NOTE TO SELF: we are checking if there is some state S and transition T st S is safe, and T(S) is unsafe
for EACH PBT ASSERTION A
In other words, S satisfies rhs of A (safety) and rhs of T (valid transition)
T(S) satisfies lhs of T (valid transition) but NOT lhs of S (unsafe state)
will need var_pre and var_post for each variable in state_variables