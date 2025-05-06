const css = require('css');
const fs = require('fs');

// Given a CSS class, and a property-value pair to check, confirms whether or not the given class ever has that property-value pair assigned.
// Ex: checkCssPropertyValue('./test.css', 'body', 'background', '#ffffff')
// Returns whether the test.css file's body class has a white background.
function checkCssPropertyValueByFilepath(cssFilepath, cssClass, property, value) {
    // Read file
    const cssCode = fs.readFileSync(cssFilepath, 'utf8');

    return checkCssPropertyValue(cssCode, cssClass, property, value);
}

function checkCssPropertyValue(cssString, cssClass, property, value) {
    // Convert to object with css parser
    const ast = css.parse(cssString);
    
    // Print css object structure
    // console.log('AST:', JSON.stringify(ast, null, 2));

    // Traverse object
    if (ast) {
        const stylesheet = ast["stylesheet"]
        if (stylesheet) {
            // Loop through CSS rules in object 
            const rules = stylesheet["rules"]
            for (const rule of rules) {
                const selectors = rule["selectors"]
                // Check whether the class is involved in this rule
                if (selectors && selectors.includes(cssClass)) {
                    // Check whether a declaration in the rule contains the property
                    const declarations = rule["declarations"]
                    for (const dec of declarations) {
                        if (dec.property === property && dec.value === value) {
                            return true;
                        }
                    }
                } 
            }
        }
    }

    // Didn't find a rule where the given class had value assigned to property
    return false;
}


// Test checking white background
console.log("Testing checkCssPropertyValue for a white background: " +
    checkCssPropertyValueByFilepath('test.css', 'body', 'background', '#ffffff')
)