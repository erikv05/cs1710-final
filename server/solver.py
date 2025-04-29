from datatypes import *
from z3 import *
def solveReq(req: SolverRequest) -> list[SolverResponseEntry]:
    solver = PageTransitionSolver(req = req)
    toReturn = []
    for assertion in solver.assertions:
        solver.s.push()
        solver.s.add(solver.assertions[assertion])
        result = solver.s.check()
        if result == sat: #if sat, the assertion failed, and should be added to the response entry. otherwise, do nothing
            model = solver.s.model
            assignments = [Literal(var, model[var]) for var in solver.vars]
            toReturn.append(SolverResponseEntry(assertion, "TODO", assignments))
    return toReturn

class PageTransitionSolver():
    req: SolverRequest
    def __init__(self):
        """Constructor of this class"""
        # Solver
        self.s = Solver()
        self.vars = {} #map of variable names to their z3 bool objects
        #todo: figure out if I need to make a distinction in var types here
        for var in self.req.state_variables:
            self.vars[var] = Bools(var)
        for var in self.req.pbt_variables:
            self.vars[var] = Bools(var)

        self.transitions = {} # map of state transitions to z3 bools representing whether they are taken
        self.assertions = {} # map of pbt_assertions to z3 bools representing whether they are respected
        for transition in self.req.state_transitions:
            self.transtions[transition.name] = Bools(transition.name)
            for disjunction in transition.lhs + transition.rhs: #transitions are only taken if both rhs and lhs are true
                self.s.add(
                    Implies(self.transitions[transition.name], 
                                   Or([self.vars[lit.name] == lit.assignment for lit in disjunction])))
        self.s.add(Or(self.transitions.values())) #one transtition must be taken

        for assertion in self.req.pbt_assertions:
            self.assertions[assertion.name] = Bools(assertion.name)
            lhs = Bool(assertion.name + '_lhs')
            rhs = Bool(assertion.name + '_rhs')
            for disjunction in transition.lhs:
                self.s.add(
                    Implies(lhs, 
                                   Or([self.vars[lit.name] == lit.assignment for lit in disjunction])))
            for disjunction in transition.rhs: 
                self.s.add(
                    Implies(rhs, 
                                   Or([self.vars[lit.name] == lit.assignment for lit in disjunction])))
            self.s.add(self.assertions[assertion.name] == Implies(lhs, rhs)) #assertion is respected if lhs implies rhs
        

