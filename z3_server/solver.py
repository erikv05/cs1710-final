from datatypes import *
from z3 import *
TRACE_LEN = 5
def solveReq(req: SolverRequest) -> SolverResponse:
    solver = PageTransitionSolver(req, TRACE_LEN)
    result = solver.s.check()
    if result == sat: #if sat, the assertion failed, and should be added to the response entry. otherwise, do nothing
        print("is sat")
        model = solver.s.model()
        return SolverResponse(result="failed",
                               states=[
                                   [
                                       Literal(name=var, assignment=bool(model[state[var]]))
                                       for var in solver.req.state_variables
                                   ]
                                   for state in solver.trace
                               ],
                               violated_pbt=solver.req.pbt_assertion.name)
    else:
        return SolverResponse(result="passed", states=[], violated_pbt="")


class PageTransitionSolver():
    req: SolverRequest
    trace_len: int
    Solver: Solver
    pbt_vars: dict[str, BoolRef]
    trace: list[dict[str, BoolRef]]

    def CheckLit(self, lit: Literal, state: int) -> BoolRef:
        #returns a Bool checking whether the state_variable is satisfied literal at a given state
        return self.trace[state][lit.name] == lit.assignment
    
    def CheckPbtLit(self, lit : Literal) -> BoolRef:
        # equivalent to CheckLit(self, lit, state) for pbt variables
        return self.pbt_vars[lit.name] == lit.assignment
    
    def CheckCNF(self, CNF : list[list[Literal]], state : int) -> BoolRef :
        #retruns a Bool checking whether the CNF is satisfied at the given state
       return And(
           [Or([
                    self.CheckLit(lit, state)
                    for lit in disjunction
                ])
            for disjunction in CNF]
       ) 

    def CheckPbtCNF(self, CNF : list[list[Literal]]) -> BoolRef :
        #equivalent to CheckCNF(self, CNF, state) for pbt variables
       return And(
           [Or([
                    self.CheckPbtLit(lit)
                    for lit in disjunction
                ])
            for disjunction in CNF])   
       
    def CheckPBTVars(self, end_state : int) -> BoolRef:
        #checks that the final PBT variables match the implications in the given state 
        return Or([ 
            And(
                self.CheckCNF(branch.conditions, end_state), #we are in the given branch
                And([ #the final pbt variables match the implications
                    self.CheckPbtLit(lit)
                    for lit in branch.implications
                ])
            )
            for branch in self.req.branches
        ])

    def CheckAssertion(self, assertion: PbtAssertion, end_state : int) -> BoolRef:
        return And(
            self.CheckPBTVars(end_state),
            self.CheckPbtCNF(assertion.cnf)
        )

    def CheckTransition(self, transition: Transition, pre: int, post: int)  -> BoolRef:
        return And(    
            Or(Or([ # the given transition is taken
                    self.CheckLit(Literal(name=transition.name, assignment=end_bool), post)
                    for end_bool in transition.assignments
                ]),
                self.trace[pre][transition.name] == self.trace[post][transition.name] #"Do nothing" option
            ),
            And([ # no other variable changes
                self.trace[pre][var] == self.trace[post][var]
                for var in 
                [var for var in self.req.state_variables if var != transition.name]
            ])
        )
    def CheckBranch(self, branch: Branch, pre: int, post: int) -> BoolRef:
        if not branch.transitions:
            # If there are no transitions, just check the conditions and check that nothing changes
            return And(
                self.CheckCNF(branch.conditions, pre),
                And([self.trace[pre][var] == self.trace[post][var] for var in self.req.state_variables]) # no changes
            )
        return And(
            self.CheckCNF(branch.conditions, pre),
            Or(
                [self.CheckTransition(transition, pre, post)
                for transition in branch.transitions]
            )
        )

    def CheckDelta(self, pre: int, post: int) -> BoolRef:
        #returns a Bool checking if the transition between two states is valid
        return Or([ 
            self.CheckBranch(branch, pre, post) #pre should satisfy one branch (exactly one semantics should be handled by the API user)
            for branch in self.req.branches
        ])
       
    def __init__(self, req, trace_len):

        # Solver
        self.req = req
        self.trace_len = trace_len
        self.s = Solver()
        self.pbt_vars = {} #map of variable names to their z3 bool objects
        for var in self.req.pbt_variables: #set up pbt_variables
            self.pbt_vars[var] = Bool(var)
        self.trace = [{} for i in range(trace_len)]
        for i in range(trace_len): #set up trace
            for var in self.req.state_variables:
                self.trace[i][var] = Bool(var + "_" + str(i))
        
        self.s.add(self.CheckCNF(self.req.preconditionals, 1)) #check that the intial state is valid

        for i in range(trace_len - 1): #check that all transitions are valid
            self.s.add(self.CheckDelta(i, i + 1))
        
        self.s.add(self.CheckAssertion(self.req.pbt_assertion, trace_len - 1)) #check that the assertion is violated (NOTE: sat is represents a failed test)
