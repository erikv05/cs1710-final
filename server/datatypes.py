from pydantic import BaseModel
class Literal(BaseModel):
    variableName: str
    assignment: bool

class NamedImplication(BaseModel):
    name: str
    lhs: list[list[Literal]]
    rhs: list[list[Literal]]

class SolverRequest(BaseModel):
    state_variables: list[str]
    pbt_variables: list[str]
    state_transitions: NamedImplication
    pbt_assertions: NamedImplication

class SolverResponse(BaseModel):
    violated_pbt: str
    transition_used: str
    violating_state: list[Literal]

class TestItem(BaseModel):
    name: str
    description: str
    price: float
    tax: float