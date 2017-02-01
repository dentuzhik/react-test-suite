const expect = require('chai').expect;
const testSuiteApi = require('../build');

describe('react-test-suite', () => {
    it('should export createTestSuite', () => {
        expect(testSuiteApi.createTestSuite).to.exist;
    });

    it('should export extendTestSuite', () => {
        expect(testSuiteApi.extendTestSuite).to.exist;
    });

    it('should export renderComponent', () => {
        expect(testSuiteApi.renderComponent).to.exist;
    });

    it('should export mountComponent', () => {
        expect(testSuiteApi.mountComponent).to.exist;
    });

    it('should export shallowRenderComponent', () => {
        expect(testSuiteApi.shallowRenderComponent).to.exist;
    });

    it('should export generateStringFakes', () => {
        expect(testSuiteApi.generateStringFakes).to.exist;
    });

    it('should export generateNumberFakes', () => {
        expect(testSuiteApi.generateNumberFakes).to.exist;
    });

    it('should export generateJSXFakes', () => {
        expect(testSuiteApi.generateJSXFakes).to.exist;
    });
});
