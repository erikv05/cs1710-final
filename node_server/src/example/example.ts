import { testComponentProperties } from '../utils/testComponentProperties';

// Example usage for testing with different properties
const filePath = "/mnt/c/Users/Erik/Desktop/lfs-final/example/example_component.tsx";

const properties = [
  { name: "hasLoadingText", textToFind: "Loading..." },
  { name: "hasDarkModeButton", textToFind: "Switch to Light Mode" },
  { name: "hasLightModeButton", textToFind: "Switch to Dark Mode" }
];

const results = testComponentProperties(filePath, properties);

console.log(JSON.stringify(results, null, 2));