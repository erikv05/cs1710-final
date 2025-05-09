# Installation and Initialization

1. run `npm i` (if you haven't already)
2. run `npm run dev`

# Design

This was written using the React + TS + Vite template.

# Implementation

This supports a trivial implementation where a user is running the node server locally on port 3000 and the FastAPI Z3 server on port 8000. It then takes in some examples and passes them to the node_server, displaying the result.

# Limitations

- Minimal input validation (e.g., CNF might not be valid, using multiple parens, etc.)

# Expansion

To add more types of property-based tests, you must first define these tests and their handlers in the server. Then, you must provide:

1. A component to help the user add these tests (and the logic to send them to the server correclty) and add it to the test dropdown
2. A component to handle the completion of the tests and the result from the server

I wish we had more time to add an API so that end users can easily add these components and the handler, since new tests would seamlessly integrate into the frontend + server in that case. This would be a very neat extension of this project.
