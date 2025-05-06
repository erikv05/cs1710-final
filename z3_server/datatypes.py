from pydantic import BaseModel
from typing import Union
class Literal(BaseModel):
    name: str
    assignment: bool

class PbtAssertion(BaseModel): 
    name: str
    cnf: list[list[Literal]]

class Transition(BaseModel):
    name: str
    valid_endstates: list[bool] 

class Branch(BaseModel):
    conditions: list[list[Literal]] #CNF criteria for being in this branch
    implications: list[Literal] #resulting rendered state
    transitions: list[Transition]

class SolverRequest(BaseModel):
    state_variables: list[str]
    pbt_variables: list[str]
    branches: list[Branch]
    preconditionals: list[list[Literal]]
    pbt_assertion: PbtAssertion

class SolverResponse(BaseModel):
    result : str #passed or failed
    states: list[list[Literal]] #state trace, not a cnf
    violated_pbt: Literal #can be none






##VVVV OLD. IGNORE VVVV
class SolverResponseEntry(BaseModel):
    violated_pbt: str
    transition_used: str
    violating_state: list[Literal]



class NamedImplication(BaseModel):
    name: str
    lhs: list[list[Literal]]
    rhs: list[list[Literal]]