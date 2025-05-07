const { parse } = require('node-html-parser');
const fs = require('fs');

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
function checkHtmlPropertyValue(htmlString, cssClassOrId, property, value) {
    // Convert to object with html parser
    const root = parse(htmlString);

    // ASSUME cssClassOrId IS A CLASS FOR NOW

    // Get all elements with the given class
    const elements = root.querySelectorAll(`.${cssClassOrId}`);

    // Traverse object
    for (const element of elements) {
        // Check if the property exists and has the expected value
        if (property in element) {
            const attrValue = element[property];
            if (attrValue === value) {
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
            return attrValue === value;
        } else {
            // Property doesn't exist
            return false;
        }
    } 

    // No elements with the given class or id had the property-value pair
    return false;
}

// NEW FUNCTION: Check if any button element contains the specified text
function checkButtonTextExists(htmlString, textToFind) {
    // Convert to object with html parser
    const root = parse(htmlString);
    
    // Get all button elements
    const buttons = root.querySelectorAll('button');
    
    // Check if any button contains the text
    for (const button of buttons) {
        if (button.text.includes(textToFind)) {
            return true;
        }
    }
    
    return false;
}

// Export all functions
module.exports = {
    checkHtmlPropertyValueByFilepath,
    checkHtmlPropertyValue,
    checkButtonTextExists
};