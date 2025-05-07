import { parse } from 'node-html-parser';
import fs from 'fs';

// USE THIS FOR PROPERTY VALIDATION.
// Works for class selectors:
// console.log(checkHtmlPropertyValueByFilepath('./test.html', 'test-class', 'rawText', 'Hello World2'));
// Works for ID selectors too:
// console.log(checkHtmlPropertyValueByFilepath('./test.html', 'test-id', 'rawText', 'Hello World2'));
function checkHtmlPropertyValueByFilepath(htmlFilepath, cssClassOrId, property, value) {
    // Read file
    const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

    return checkHtmlPropertyValue(htmlCode, cssClassOrId, property, value);
}

// USE THIS IF YOU HAVE THE HTML STRING ALREADY
export function checkHtmlPropertyValue(htmlString, cssClassOrId, property, value) {
    // Convert to object with html parser
    const root = parse(htmlString);

    // ASSUME cssClassOrId IS A CLASS FOR NOW
    if (cssClassOrId) {
        
        // Get all elements with the given class
        const elements = root.querySelectorAll(`.${cssClassOrId}`);
        
        // Traverse object
        for (const element of elements) {
            // Check if the property exists and has the expected value
            if (property in element) {
                const attrValue = element[property];
                if (typeof attrValue === "string" && attrValue.includes(value)) {
                    return true
                } else if (value === attrValue) {
                    return true;
                }
            }
        }
        
        // TRY cssClassOrId AS AN ID INSTEAD
        
        // Look for the element with the given id
        const element = root.querySelector(`#${cssClassOrId}`);
        
        // Traverse object
        if (element) {
            // Check if the property exists and has the expected value
            if (property in element) {
                const attrValue = element[property];
                console.log(attrValue)
                console.log(value)
                return typeof attrValue === "string" ? attrValue.includes(value) : attrValue === value;
            } else {
                // Property doesn't exist
                return false;
            }
        } 
        
    } else {
        // Look through all elements in the document deep recursively
        function checkRecursively(node: any) {
            // Check current node
            if (typeof node[property] !== "string") {
                if (property in node && node[property] === value) return true;
            } else {
                if (property in node && node[property].includes(value)) return true;
            }

            // Recurse on children
            if (node.childNodes && node.childNodes.length > 0) {
                for (const child of node.childNodes) {
                    if (checkRecursively(child)) {
                        return true;
                    }
                }
            }

            return false;
        }

        if (checkRecursively(root)) return true;
    }
        
    // No elements with the given class or id had the property-value pair
    return false;
}
