var directives = require('../src/directives.js');


describe('directives.js', function () {
    describe('#exctract', function () {
        var extract = directives.extract;

        it('parses require directives', function () {
            var src = '//= require ./main.js';
            extract(src).should.eql([['require', './main.js']]);
        });

        it('parses require_lib directive', function () {
            var src = '//= require_lib';
            extract(src).should.eql([['require_lib']]);
        });

        it('parses multiline directives', function () {
            var src = '//= require_lib';
            src += '\n//= require .main.js';
            extract(src).length.should.equal(2);
            extract(src)[0][0].should.equal('require_lib');
            extract(src)[1][0].should.equal('require');
        });
    });
});
