#!/usr/bin/env python3

import argparse
import json
import requests
import sys
from pprint import pprint

def send_z3_request(json_file_path):
    """
    Reads a JSON file, sends its contents as a POST request to the Z3 server,
    and prints the response.
    
    Args:
        json_file_path: Path to the JSON file containing the request data
    """
    try:
        # Read the JSON file
        with open(json_file_path, 'r') as f:
            try:
                request_data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON file: {e}")
                sys.exit(1)
        
        # Check if request_data is valid
        if not isinstance(request_data, dict):
            print("Error: JSON file must contain a valid request object")
            sys.exit(1)
        
        # Required fields for the Z3 server
        required_fields = ['state_variables', 'pbt_variables', 'branches', 'preconditionals', 'pbt_assertion']
        missing_fields = [field for field in required_fields if field not in request_data]
        
        if missing_fields:
            print(f"Error: JSON is missing required fields: {', '.join(missing_fields)}")
            print("Required fields for Z3 server: state_variables, pbt_variables, branches, preconditionals, pbt_assertion")
            sys.exit(1)
        
        # Send the POST request
        print(f"Sending request to Z3 server at http://localhost:8000/solve/...")
        try:
            response = requests.post(
                'http://localhost:8000/solve/',
                json=request_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Check response status
            response.raise_for_status()
            
            # Parse and print the response
            result = response.json()
            print("\nResponse from Z3 server:")
            print("=" * 50)
            pprint(result, indent=2)
            
            # Print a summary of the result
            if result.get('result') == 'passed':
                print("\n✅ Test PASSED: The property holds.")
            elif result.get('result') == 'failed':
                print("\n❌ Test FAILED: The property was violated.")
                print(f"   Violated property: {result.get('violated_pbt', 'Unknown')}")
                if result.get('states'):
                    print("\n   States that violated the property:")
                    pprint(result.get('states'), indent=4)
            else:
                print("\n⚠️ Unknown result format")
                
        except requests.exceptions.ConnectionError:
            print("Error: Failed to connect to Z3 server. Make sure it's running at http://localhost:8000")
            sys.exit(1)
        except requests.exceptions.Timeout:
            print("Error: Request to Z3 server timed out")
            sys.exit(1)
        except requests.exceptions.HTTPError as e:
            print(f"Error: HTTP error occurred: {e}")
            print("Response content:")
            print(response.text)
            sys.exit(1)
        except requests.exceptions.RequestException as e:
            print(f"Error: An error occurred while making the request: {e}")
            sys.exit(1)
            
    except FileNotFoundError:
        print(f"Error: File '{json_file_path}' not found")
        sys.exit(1)
    except IOError as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Send a JSON request to the Z3 solver server')
    parser.add_argument('json_file', help='Path to the JSON file containing the request data')
    
    args = parser.parse_args()
    send_z3_request(args.json_file)

if __name__ == '__main__':
    main() 