import { expect } from 'chai';
import testEvent from './event';

export default function testLink({
    linkName,
    event,
    eventHandler,
    linkRenderer
}) {
    return {
        setup(TestSuiteInstance) {
            return TestSuiteInstance.stubMethod(eventHandler);
        },

        assert(assertParams) {
            const linkNode = linkRenderer(assertParams);

            expect(
                linkNode.is('a'),
                `${linkName} is not a link`
            ).to.be.true;

            testEvent({ linkName, event, eventHandler, linkRenderer });
        }
    };
}
