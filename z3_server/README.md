#Directory Structure
* 'run_server.py': Sets up the API endpoint
* 'solver.py': Solver logic
* 'datatypes.py': Datatypes for API requests and responses 


#Running
'python run_server.py'

#Installation
'pip install -r requirements.txt'

#Testing
**TODO**: rationalize tests

#API
The format for API requests and from the frontend is given by the SolverRequest and SolverResponse types in 'datatypes.py. The solver checks if the CNF expression given in the assertion is statifiable, given the branches and intial conditions, returning a state trace if so, and a "success" message otherwise.
