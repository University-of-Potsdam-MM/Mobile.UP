var compile = require('../src/compile.js'),
    config = require('../src/config.js'),
    path = require('path'),
    expect = require('chai').expect;

describe('compile.js', function () {
    beforeEach(function () {
        this._assetPath = config.assetPath;
        config.assetPath = path.resolve(__dirname, './fixtures');
    });

    afterEach(function () {
        config.assetPath = this._assetPath;
    });

    describe('#compile()', function () {
        it('requires submodules', function (done) {
            compile.compile('./module1.js').then(function (data) {
                try {
                    expect(data.match(/this is module 2/)).to.be.ok;
                    done();
                } catch (e) { done(e); }
            });
        });
    });
});
