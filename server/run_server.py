from typing import Union
from fastapi import FastAPI
import uvicorn
from dataclasses import dataclass

@dataclass
class literal:
    variableName: str
    assignment: bool
app = FastAPI()

@dataclass
class cnfExpr:
    list[literal]

@dataclass
class solverRequest:
    state_variables: list[str]
    pbt_variables: list[str]
    ...



@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)