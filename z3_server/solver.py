from datatypes import *
from z3 import *
TRACE_LEN = 5
def solveReq(req: SolverRequest) -> list[SolverResponseEntry]:
    solver = PageTransitionSolver(req, TRACE_LEN)
    result = solver.s.check()
    if result == sat: #if sat, the assertion failed, and should be added to the response entry. otherwise, do nothing
        print("is sat")
        model = solver.s.model()
    else:
        #TODO: figure out return for passed test
        return 0
    toReturn = []
    """for assertion in solver.assertions:
        print("assertion:")
        print(assertion)
        print(solver.assertions[assertion])
        solver.s.push()
        solver.s.add(Not(solver.assertions[assertion]))
        result = solver.s.check()
        if result == sat: #if sat, the assertion failed, and should be added to the response entry. otherwise, do nothing
            print("is sat")
            model = solver.s.model()
            assignments = [Literal(name=var, assignment=bool(model[solver.vars[var]])) for var in solver.vars]
            transition_used = [transition for transition in solver.transitions if model[solver.transitions[transition]]][0]
            toReturn.append(SolverResponseEntry(violated_pbt=assertion, transition_used=transition_used, violating_state=assignments))
        solver.s.pop()
    return toReturn"""



class PageTransitionSolver():
    req: SolverRequest
    trace_len: int
    Solver: Solver
    pbt_vars: dict[str, Bool]
    trace: list[dict[str, Bool]]

    def CheckLit(self, lit: Literal, state: int) -> Bool:
        #returns a Bool checking whether the state_variable is satisfied literal at a given state
        self.trace[state][lit.name] == lit.assignment
    
    def CheckLit(self, lit : Literal) -> Bool:
        # equivalent to CheckLit(self, lit, state) for pbt variables
        self.pbt_vars[lit.name] == lit.assignment
    
    def CheckCNF(self, CNF : list[list[Literal]], state : int) -> Bool :
        #retruns a Bool checking whether the CNF is satisfied at the given state
       And(
           [Or([
                    self.CheckLit(lit, state)
                    for lit in disjunction
                ])
            for disjunction in CNF]
       ) 

    def CheckCNF(self, CNF : list[list[Literal]]) -> Bool :
        #equivalent to CheckCNF(self, CNF, state) for pbt variables
       And(
           [Or([
                    self.CheckLit(lit)
                    for lit in disjunction
                ])
            for disjunction in CNF])   
       
    def CheckPBTVars(self, end_state : int):
        #checks that the final PBT variables match the implications in the given state 
        Or([ 
            And(
                self.CheckCNF(branch.conditions, end_state), #we are in the given branch
                And([ #the final pbt variables match the implications
                    self.CheckLit(lit)
                    for lit in branch.implications
                ])
            )
            for branch in self.req.branches
        ])

    def CheckAssertion(self, assertion: PbtAssertion, end_state : int):
        And(
            self.CheckPBTVars(end_state),
            self.CheckCNF(assertion.cnf)
        )

    def CheckTransition(self, transition: Transition, pre: int, post: int) -> Bool:
        And(    
            Or([ # the given transition is taken
                #TODO: add "DO NOTHING" option
                self.CheckLit(Literal(transition.name, end_bool), post)
                for end_bool in transition.valid_endstates
            ]),
            And([ # no other variable changes
                self.trace[pre][var] == self.trace[post][var]
                for var in 
                [var for var in self.req.state_variables if var != transition.name]
            ])
        )
    def CheckBranch(self, branch: Branch, pre: int, post: int) -> Bool:
        And(
            self.CheckCNF(branch.conditions, pre),
            Or(
                self.CheckTransition(transition, pre, post)
                for transition in branch.transitions
            )
        )

    def CheckDelta(self, pre: int, post: int) -> Bool:
        #returns a Bool checking if the transition between two states is valid
        Or([ 
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
            for var in self.req.state_variable:
                self.trace[i][var] = Bool(var + "_" + i)
        
        self.s.add(self.CheckCNF(self.req.preconditionals, 1)) #check that the intial state is valid

        for i in range(trace_len - 1): #check that all transitions are valid
            self.s.add(self.CheckDelta(i, i + 1))
        
        self.s.add(self.CheckAssertion(self.req.pbt_assertion)) #check that the assertion is violated (NOTE: sat is represents a failed test)





        """
        self.transitions = {} # map of state transitions to z3 bools representing whether they are taken
        self.assertions = {} # map of pbt_assertions to z3 bools representing whether they are respected
        for transition in self.req.state_transitions:
            self.transitions[transition.name] = Bool(transition.name)
            for disjunction in transition.lhs + transition.rhs: #transitions can only be taken if both rhs and lhs are true
                self.s.add(
                    Implies(self.transitions[transition.name], 
                                   Or([self.vars[lit.name] == lit.assignment for lit in disjunction])))
        





        self.s.add(Or([self.transitions[k] for k in self.transitions]))#self.transitions.values())) #one transtition must be taken
        for assertion in self.req.pbt_assertions:
            self.assertions[assertion.name] = Bool(assertion.name)
            lhs = Bool(assertion.name + '_lhs')
            rhs = Bool(assertion.name + '_rhs')
            self.s.add(lhs == And(
                [Or(
                    [
                        self.vars[lit.name] == lit.assignment
                        for lit in disjunction
                    ]
                )
                    for disjunction in assertion.lhs]
            ))
            self.s.add(rhs == And(
                [Or(
                    [
                        self.vars[lit.name] == lit.assignment
                        for lit in disjunction
                    ]
                )
                    for disjunction in assertion.rhs]
            ))
            self.s.add(self.assertions[assertion.name] == Implies(lhs, rhs)) #assertion is respected if lhs implies rhs
        """        
