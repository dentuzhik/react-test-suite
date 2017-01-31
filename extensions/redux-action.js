import { expect } from 'chai';
import { generateStringFakes } from '../src/helpers';

export default function testReduxAction({
    methodToTest,
    methodToTestArgs = [],

    actionsModuleName,
    actionCreatorName,
    actionCreatorArgs = [],

    propsAsArguments,
    testNotDispatched
}) {
    const actionObject = generateStringFakes();

    return {
        setup(TestSuiteInstance) {
            return TestSuiteInstance
                .stubProp('dispatch')
                .injectDependencies({
                    [actionsModuleName]: {
                        [actionCreatorName]: function(stub) {
                            return stub
                                .withArgs(...actionCreatorArgs)
                                .returns(actionObject);
                        }
                    }
                });
        },

        assert({ wrapper, propsStubs }) {
            const dispatchStub = propsStubs.dispatch;

            if (propsAsArguments) {
                wrapper.instance()[methodToTest](wrapper.instance().props);
            } else {
                wrapper.instance()[methodToTest](...methodToTestArgs);
            }

            if (testNotDispatched) {
                expect(
                    dispatchStub,
                    'The action has dispatched, although it should not have happened'
                ).not.to.be.called;
            } else {
                expect(
                    dispatchStub,
                    'The action has not been dispatched'
                ).to.be.calledOnce;

                expect(
                    dispatchStub,
                    'The action has been dispatched with incorrect action object'
                ).to.be.calledWith(actionObject);
            }
        }
    };
}
