import { expect } from 'chai';

export default function testEvent({
    elementName,
    event,
    eventHandler,
    elementRenderer
}) {
    return {
        setup(TestSuiteInstance) {
            return TestSuiteInstance.stubMethod(eventHandler);
        },

        assert(assertParams) {
            const { methodsStubs } = assertParams;
            const elementNode = elementRenderer(assertParams);

            expect(
                elementNode,
                `${elementName} does not exist`
            ).to.exist;

            elementNode.simulate(event);
            expect(
                methodsStubs[eventHandler],
                `${elementName} clicked, but ${eventHandler} handler was not called`
            ).to.have.been.calledOnce;
        }
    };
}
