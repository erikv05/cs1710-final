import requests
import pprint

# Define the test data - same as in ex1_req.json
test_data = {
  "state_variables": ["isLoading", "isDarkMode"],
  "pbt_variables": ["hasDarkModeButton"],
  "branches": [
    {
      "conditions": [
        [{ "name": "isLoading", "assignment": True }],
        [{ "name": "isDarkMode", "assignment": True }]
      ],
      "implications": [{ "name": "hasDarkModeButton", "assignment": False }],
      "transitions": []
    },
    {
      "conditions": [
        [{ "name": "isLoading", "assignment": True }],
        [{ "name": "isDarkMode", "assignment": False }]
      ],
      "implications": [{ "name": "hasDarkModeButton", "assignment": False }],
      "transitions": []
    },
    {
      "conditions": [
        [{ "name": "isLoading", "assignment": False }],
        [{ "name": "isDarkMode", "assignment": True }]
      ],
      "implications": [{ "name": "hasDarkModeButton", "assignment": True }],
      "transitions": [{ "name": "isDarkMode", "assignments": [False] }]
    },
    {
      "conditions": [
        [{ "name": "isLoading", "assignment": False }],
        [{ "name": "isDarkMode", "assignment": False }]
      ],
      "implications": [{ "name": "hasDarkModeButton", "assignment": False }],
      "transitions": [{ "name": "isDarkMode", "assignments": [True, False] }]
    }
  ],
  "preconditionals": [[{ "name": "isLoading", "assignment": False }]],
  "pbt_assertion": {
    "name": "hasDarkModeButton",
    "cnf": [[{ "name": "hasDarkModeButton", "assignment": True }]]
  }
}

def test_root_endpoint():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    response = requests.get("http://localhost:8000/")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_solve_endpoint():
    """Test the solve endpoint with the example request"""
    print("Testing solve endpoint...")
    
    # Send the POST request to the /solve/ endpoint
    response = requests.post(
        "http://localhost:8000/solve/",
        json=test_data
    )
    
    print(f"Status code: {response.status_code}")
    print("Response:")
    pprint.pprint(response.json())
    print("-" * 50)
    
    # Print interpretation of the result
    result = response.json()
    if result["result"] == "failed":
        print("The PBT assertion was violated!")
        print(f"Violated PBT: {result['violated_pbt']}")
        print("State trace that led to the violation:")
        for i, state in enumerate(result["states"]):
            print(f"State {i}:")
            for var in state:
                print(f"  {var['name']} = {var['assignment']}")
    else:
        print("The PBT assertion passed all tests.")
    
if __name__ == "__main__":
    print("Starting tests for Z3 solver server\n")
    
    # Test the root endpoint
    test_root_endpoint()
    
    # Test the solve endpoint
    test_solve_endpoint()
    
    print("\nTests completed.")