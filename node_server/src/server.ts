import express from 'express';
import cors from 'cors';
import { NodeAPIRequestSchema, TextPBTAssertion } from './types/PropertyDefinition';
import { testComponentProperties } from './utils/testComponentProperties';
import { ReactParseResult, SolverRequest } from './types/SolverRequest';

const app = express();
const port = 3000; // Yes this is hardcoded sue me

app.use(express.json());
app.use(cors());

/*

Example cURL:

curl -X POST http://localhost:3000/   -H "Content-Type: application/json"   -d '{
    "properties": [
      { "name": "hasLoadingText", "textToFind": "Loading..." },
      { "name": "hasDarkModeButton", "textToFind": "Switch to Light Mode" },
      { "name": "hasLightModeButton", "textToFind": "Switch to Dark Mode" }
    ],
    "filePath": "/mnt/c/Users/Erik/Desktop/lfs-final/node_server/src/example/example_component.tsx" # NOTE: ONLY ON ERIK'S SYSTEM'S WSL
  }'

*/

app.post('/', (req, res) => {
    const parseResult = NodeAPIRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).send('Invalid request body: properties must be a NodeAPIRequestSchema object');
        return;
    }

    // We know this works b/c the above didn't fail
    const textAssertions: TextPBTAssertion[] = req.body.textAssertions;
    const filePath: string = req.body.filepath;

    let result: ReactParseResult;

    try {
        result = testComponentProperties(filePath, textAssertions);
    } catch (error: any) {
        res.status(500).send('Error processing the file: ' + error.message);
        return;
    }

    let tests: SolverRequest[] = [];

    for (let i = 0; i < result.assertions.length; i++) {
        tests.push({
            state_variables: result.state_variables,
            pbt_variables: result.pbt_variables,
            branches: result.branches,
            preconditionals: result.assertions[i].preconditionals,
            pbt_assertions: result.assertions[i].pbt_assertions
        })
    }



    // TODO: call z3 api

    res.send({"result": {"success": true}, "data": result});
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});