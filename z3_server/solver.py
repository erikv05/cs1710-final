from datatypes import *
from z3 import *
def solveReq(req: SolverRequest) -> list[SolverResponseEntry]:
    solver = PageTransitionSolver(req)
    toReturn = []
    for assertion in solver.assertions:
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
            toReturn.append(SolverResponseEntry(violated_pbt=assertion, transition_used="TODO", violating_state=assignments))
        solver.s.pop()
    return toReturn

class PageTransitionSolver():
    req: SolverRequest
    def __init__(self, req):
        """Constructor of this class"""
        # Solver
        self.req = req
        self.s = Solver()
        self.vars = {} #map of variable names to their z3 bool objects
        #todo: figure out if I need to make a distinction in var types here
        for var in self.req.state_variables:
            self.vars[var] = Bool(var)
        for var in self.req.pbt_variables:
            self.vars[var] = Bool(var)

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
        

