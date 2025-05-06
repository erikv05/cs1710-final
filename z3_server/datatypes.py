from pydantic import BaseModel
class Literal(BaseModel):
    name: str
    assignment: bool

class PbtAssertion: 
    name: str
    cnf: list[list[Literal]]

class Branch(BaseModel):
    conditions: list[list[Literal]] #CNF criteria for being in this branch
    implications: list[Literal] #resulting rendered state
    transitions: list[Literal] #NOTE: here, the assignment type is used to indicate type of transition.
                               # True indicates a false->true tranition, False indicates a True->false transition

class SolverRequest(BaseModel):
    state_variables: list[str]
    pbt_variables: list[str]
    branches: list[Branch]
    preconditionals: list[Literal]
    pbt_assertions: list[PbtAssertion]

class SolverResponse(BaseModel):
    states: list[list[Literal]]
    violated_pbt: Literal






##VVVV OLD. IGNORE VVVV
class SolverResponseEntry(BaseModel):
    violated_pbt: str
    transition_used: str
    violating_state: list[Literal]



class NamedImplication(BaseModel):
    name: str
    lhs: list[list[Literal]]
    rhs: list[list[Literal]]