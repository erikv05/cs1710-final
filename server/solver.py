from datatypes import *
from z3 import *
def solveReq(req: SolverRequest) -> SolverResponse:
    Solver()

class PageTransitionSolver():
    req: SolverRequest
    def __init__(self):
        """Constructor of this class"""
        # Solver
        self.s = Solver()
        self
        self.state_vars = {} 
        for var in self.req.state_variables:
            self.state_vars[var] = Bools(var)
        self.pbt_vars = {} 
        for var in self.req.pbt_variables:
            self.pbt_vars[var] = Bools(var)
            
        self.req.state_variables
        self.req.pbt_variables