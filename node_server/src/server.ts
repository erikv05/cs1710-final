import express from 'express';
import cors from 'cors';
import { TextPropertyDefinition, TextPropertyDefinitionSchema } from './types/PropertyDefinition';
import { testComponentProperties } from './utils/testComponentProperties';
import { PropertyTestResult } from './types/PropertyTestResult';

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
    const parseResult = TextPropertyDefinitionSchema.array().safeParse(req.body.properties);
    if (!parseResult.success) {
        res.status(400).send('Invalid request body: properties must be a TextPropertyDefinition array');
        return;
    } else if (typeof req.body.filePath !== 'string') {
        res.status(400).send('Invalid request body: filePath must be a string');
        return;
    }

    // We know this works b/c the above didn't fail
    const properties: TextPropertyDefinition[] = req.body.properties;
    const filePath: string = req.body.filePath;

    let results: PropertyTestResult[] = [];

    try {
        results = testComponentProperties(filePath, properties);
    } catch (error: any) {
        res.status(500).send('Error processing the file: ' + error.message);
        return;
    }

    // TODO: call z3 api

    res.send({"result": "success", "data": results});
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});