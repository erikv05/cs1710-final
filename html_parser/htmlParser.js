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

// Given a CSS id, and a property-value pair to check, confirms whether or not the given id ever has that property-value pair assigned.
function checkHtmlPropertyValueById(htmlFilepath, cssId, property, value) {
    // Read file
    const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

    // Convert to object with html parser
    const root = parse(htmlCode);
    
    // Look for the element with the given id
    const element = root.querySelector(`#${cssId}`);

    // Traverse object
    if (element) {
        // Check if the property exists and has the expected value
        if (property in element) {
            const attrValue = element.getAttribute(property);
            return attrValue === value;
        } else {
            // Property doesn't exist
            return false;
        }
    } else {
        // Element with the given id doesn't exist
        return false;
    }
}
// console.log(checkHtmlPropertyValueById('test.html', 'list', 'id', 'list'));

// Given a CSS class, and a property-value pair to check, confirms whether or not ANY element with the given class has that property-value pair assigned.
function checkHtmlPropertyValueByClass(htmlFilepath, cssClass, property, value) {
    // Read file
    const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

    // Convert to object with html parser
    const root = parse(htmlCode);
    // console.log(root);

    // Get all elements with the given class
    const elements = root.querySelectorAll(`.${cssClass}`);

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
    // No elements with the given class had the property-value pair
    return false;
}

// function checkHtmlTextById(htmlFilepath, cssId, text) {
//     // Read file
//     const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

//     // Convert to object with html parser
//     const root = parse(htmlCode);

//     // Look for the element with the given id
//     const element = root.querySelector(`#${cssId}`);

//     if (element) {
//         // Check if the text exists and has the expected value
//         if (element.rawText === text) {
//             console.log('Found text:', element.rawText);
//             return true;
//         }
//         if (element.childNodes) {
//             for (const child of element.childNodes) {
//                 console.log('Found text in child:', child.rawText);
//                 if (child.rawText === text) {
//                     return true;
//                 }
//             }
//         }
//     }
    
// }
// console.log(checkHtmlTextById('test.html', 'test-id', 'Hello World2'));

// function checkHtmlTextByClass(htmlFilepath, cssClass, text) {
//     // Read file
//     const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

//     // Get all elements with the given class
//     const elements = root.querySelectorAll(`.${cssClass}`);

//     for (const element of elements) {
//         // Check if the text exists and has the expected value
//         if (element.rawText === text) {
//             return true;
//         }
//     }
// }

// console.log(checkHtmlPropertyValueByClass('test.html', 'test-class', 'rawText', 'Hello World2'));

// console.log(root.firstChild.structure);
// ul#list
//   li
//     #text
// console.log(root.querySelector('#list'));
// { tagName: 'ul',
//   rawAttrs: 'id="list"',
//   childNodes:
//    [ { tagName: 'li',
//        rawAttrs: '',
//        childNodes: [Object],
//        classNames: [] } ],
//   id: 'list',
//   classNames: [] }
// console.log(root.toString());
// <ul id="list"><li>Hello World</li></ul>
// root.set_content('<li>Hello World</li>');
// root.toString();	// <li>Hello World</li>