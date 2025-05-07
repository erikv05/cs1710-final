import express from 'express';
import cors from 'cors';
import { NodeAPIRequestSchema, TextPBTAssertion } from './types/PropertyDefinition';
import { testComponentProperties } from './utils/testComponentProperties';
import { ReactParseResult, SolverRequest, PBTOutAssertion } from './types/SolverRequest';
import { Z3ResponseSchema, Z3Response } from './types/Z3Response';

const app = express();
const port = 3000; // Yes this is hardcoded sue me

app.use(express.json());
app.use(cors());

// Helper function to negate a PBT assertion
function negatePbtAssertion(assertion: PBTOutAssertion): PBTOutAssertion {
    // Create a deep copy of the assertion
    const negatedAssertion: PBTOutAssertion = {
        name: assertion.name,
        cnf: JSON.parse(JSON.stringify(assertion.cnf))
    };
    
    // There should only be one clause with one literal as mentioned
    // This will safely handle even if there are more, but the structure is expected to be [[literal]]
    for (let i = 0; i < negatedAssertion.cnf.length; i++) {
        for (let j = 0; j < negatedAssertion.cnf[i].length; j++) {
            // Negate the assignment value of the literal
            negatedAssertion.cnf[i][j].assignment = !negatedAssertion.cnf[i][j].assignment;
        }
    }
    
    return negatedAssertion;
}

app.post('/', async (req, res) => {
    const parseResult = NodeAPIRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).send('Invalid request body: properties must be a NodeAPIRequestSchema object');
        return;
    }

    // We know this works b/c the above didn't fail
    const textAssertions: TextPBTAssertion[] = req.body.textAssertions;
    const filePath: string = req.body.filepath;
    // Extract the useStatefulTesting flag (defaults to true for backward compatibility)
    const useStatefulTesting: boolean = req.body.useStatefulTesting !== false;

    console.log("Received text assertions:", textAssertions);
    console.log("Number of assertions: ", textAssertions.length)
    console.log("Use Stateful Testing: ", useStatefulTesting)

    let result: ReactParseResult;

    try {
        result = testComponentProperties(filePath, textAssertions);
    } catch (error: any) {
        res.status(500).send('Error processing the file: ' + error.message);
        return;
    }

    console.log("Achieved valid parse result");

    let tests: SolverRequest[] = [];

    for (let i = 0; i < result.assertions.length; i++) {
        // Create a copy of the branches to modify if not using stateful testing
        const branches = useStatefulTesting 
            ? result.branches 
            : result.branches.map(branch => ({
                ...branch,
                transitions: [] // Empty the transitions array when stateful testing is disabled
            }));

        // Negate the pbt_assertion to represent unsafe states as expected by Z3
        const negatedAssertion = negatePbtAssertion(result.assertions[i].pbt_assertions);

        const test = {
            state_variables: result.state_variables,
            pbt_variables: result.pbt_variables,
            branches: branches,
            preconditionals: result.assertions[i].preconditionals,
            pbt_assertion: negatedAssertion
        };
        console.log("Test variables:", {
            state_variables: test.state_variables,
            pbt_variables: test.pbt_variables,
            pbt_assertion: test.pbt_assertion
        });
        tests.push(test);
    }

    console.log(`Created ${tests.length} tests`)

    const z3Results = await Promise.all(tests.map(async (test) => {
        try {
            console.log("Sending test to Z3:", JSON.stringify(test, null, 2));
            const response = await fetch('http://localhost:8000/solve/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(test)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Z3 server responded with status ${response.status}: ${errorText}`);
            }
            
            const responseData = await response.json();
            const parseResult = Z3ResponseSchema.safeParse(responseData);
            
            if (!parseResult.success) {
                console.error('Invalid Z3 response format:', parseResult.error);
                throw new Error('Invalid response format from Z3 server');
            }
            
            return parseResult.data;
        } catch (error: any) {
            console.error('Error calling Z3 server:', error.message);
            return { error: error.message };
        }
    }));

    res.send({
        "results": z3Results
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});