from pydantic import BaseModel
from typing import Union
class Literal(BaseModel):
    name: str
    assignment: bool

class PbtAssertion(BaseModel): 
    name: str
    cnf: list[list[Literal]] #An unsafe condition, represented in Conjunctive normal form.
                             #If this is satisfiable, the test has failed

class Transition(BaseModel):
    name: str #name of the variable in question
    assignments: list[bool] #possible values this variable can occupy after the transition

class Branch(BaseModel):
    conditions: list[list[Literal]] #CNF criteria for taking this branch
    implications: list[Literal] #resulting rendered state of this branch
    transitions: list[Transition] #availible transitions from this branch

class SolverRequest(BaseModel):
    state_variables: list[str] #state variables being considered
    pbt_variables: list[str] #variables used for property based testing (these refer to rendered elements)
    branches: list[Branch] #Use to represent the availbe transitions/rendered states availbe to each
                           #arrangements of state variables
    preconditionals: list[list[Literal]] #cnf that must be satisfied by the first state in the trace
    pbt_assertion: PbtAssertion  #The unsafe condition being tested

class SolverResponse(BaseModel):
    result : str #passed or failed
    states: list[list[Literal]] #If the test failed, this will be state trace represting the path
                                #taken to reach the unsafe state. 
                                #empty if the pass succeeded
                                #not a cnf
    violated_pbt: str #empty if the test passed, the name of the assertion if the test failed




