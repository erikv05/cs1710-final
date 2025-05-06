const { parse } = require('node-html-parser');
const fs = require('fs');

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
console.log(checkHtmlPropertyValueById('test.html', 'list', 'id', 'list'));

// Given a CSS class, and a property-value pair to check, confirms whether or not ANY element with the given class has that property-value pair assigned.
function checkHtmlPropertyValueByClass(htmlFilepath, cssClass, property, value) {
    // Read file
    const htmlCode = fs.readFileSync(htmlFilepath, 'utf8');

    // Convert to object with html parser
    const root = parse(htmlCode);

    // Get all elements with the given class
    const elements = root.querySelectorAll(`.${cssClass}`);

    // Traverse object
    for (const element of elements) {
        // Check if the property exists and has the expected value
        if (property in element) {
            const attrValue = element.getAttribute(property);
            if (attrValue === value) {
                return true;
            }
        }
    }
    // No elements with the given class had the property-value pair
    return false;
}

console.log(checkHtmlPropertyValueByClass('test.html', 'test-class', 'id', 'test-id'));

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