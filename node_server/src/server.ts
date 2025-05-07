import express from 'express';
import cors from 'cors';
import { NodeAPIRequestSchema, TextPBTAssertion } from './types/PropertyDefinition';
import { testComponentProperties } from './utils/testComponentProperties';
import { ReactParseResult, SolverRequest } from './types/SolverRequest';
import { Z3ResponseSchema, Z3Response } from './types/Z3Response';

const app = express();
const port = 3000; // Yes this is hardcoded sue me

app.use(express.json());
app.use(cors());

app.post('/', async (req, res) => {
    const parseResult = NodeAPIRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).send('Invalid request body: properties must be a NodeAPIRequestSchema object');
        return;
    }

    // We know this works b/c the above didn't fail
    const textAssertions: TextPBTAssertion[] = req.body.textAssertions;
    const filePath: string = req.body.filepath;

    console.log("Received text assertions:", textAssertions);
    console.log("Number of assertions: ", textAssertions.length)

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
        const test = {
            state_variables: result.state_variables,
            pbt_variables: result.pbt_variables,
            branches: result.branches,
            preconditionals: result.assertions[i].preconditionals,
            pbt_assertion: result.assertions[i].pbt_assertions
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