from fastapi import FastAPI
import uvicorn
from datatypes import *
from solver import solveReq

app = FastAPI()



@app.get("/")
def read_root():
    return {"Hello": "World"}



@app.post("/solve/")
def read_item(req: SolverRequest) -> SolverResponse:
    return solveReq(req)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)