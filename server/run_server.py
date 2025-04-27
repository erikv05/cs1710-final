from fastapi import FastAPI
import uvicorn
from datatypes import *
from solver import solve

app = FastAPI()



@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/items/")
async def create_item(item: TestItem):
    print(item.description)
    return item.price * item.tax

@app.post("/testlit/")
def read_item(lit: Literal):
    print(lit)
    print(lit.assignment)
    return {"item_id": 1, "q": "blah"}

@app.post("/testNamedImp/")
def read_item(imp: NamedImplication):
    print(imp.name)
    print(imp.lhs)
    print(imp.lhs[0][0])
    return {"item_id": 1, "q": "blah"}

@app.post("/solve/")
def read_item(req: SolverRequest):
    return solve(req)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)