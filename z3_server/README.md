#Structure
**TODO**
* 'run_server.py': Sets up the API endpoint
* 'solver.py': Solver logic
* 'datatypes.py': Datatypes for API requests and responses 


#Running
'python run_server.py'

#Installation
**TODO**: freeze requirements

#Testing
**TODO**: rationalize tests

#API
**TODO**proper spec doc

For now, the format for API requests and from the frontend is given by the SolverRequest and SolverResponse types in 'datatypes.py. The solver checks if the CNF expression given in the assertion is statifiable, returning a state trace if so, and a "success" message otherwise.
