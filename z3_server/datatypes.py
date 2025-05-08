from pydantic import BaseModel
from typing import Union
class Literal(BaseModel):
    name: str
    assignment: bool

class PbtAssertion(BaseModel): 
    name: str
    cnf: list[list[Literal]] #If this is satisfiable, the test has failed

class Transition(BaseModel):
    name: str
    assignments: list[bool] 

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
    violated_pbt: str #empty if nothing is violated




