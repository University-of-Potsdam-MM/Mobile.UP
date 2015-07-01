cd www

# Needs requirejs optimizer. See http://requirejs.org/docs/optimization.html
r.js -o baseUrl=js mainConfigFile=js/main.js name=main out=main-built.js
