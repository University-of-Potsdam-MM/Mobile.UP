// use this document for creating XML
var doc = document.implementation.createDocument(null, null, null);

// function that creates the XML structure
function tag() {
    var node = doc.createElement(arguments[0]), text, child;

    for(var i = 1; i < arguments.length; i++) {
        child = arguments[i];
        if(typeof child == 'string') {
            child = doc.createTextNode(child);
        }
        node.appendChild(child);
    }

    return node;
};

// create the XML structure recursively
var xml =
tag('report',
    tag('submitter',
        tag('name', 'John Doe')
    ),
    tag('students',
        tag('student',
            tag('name', 'Alice'),
            tag('grade', '80')
        ),
        tag('student',
            tag('name', 'Bob'),
            tag('grade', '90')
        )
    )
);

var string = new XMLSerializer().serializeToString(xml);

console.log(string);
