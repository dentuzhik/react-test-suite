import React from 'react';
import {
    assign,
    partial,
    forEach,
    omit,
    isArray,
    isFunction,
    isPlainObject,
} from 'lodash';

import chai from 'chai';
import { shallow, mount, render } from 'enzyme';
import chaiEnzyme from 'chai-enzyme';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import sinonTest from 'sinon-test';

import {
    generateJSXFakes,
    generateStringFakes,
    generateNumberFakes,
    mergeStubsDescriptors,
    mergeDependenciesDescriptors,
    EMPTY_ENHANCER
} from './helpers';
import TestSuite from './TestSuite';

import testEvent from '../extensions/event';
import testLink from '../extensions/link';
import testReduxAction from '../extensions/redux-action';

chai.use(chaiEnzyme());
chai.use(sinonChai);

sinon.test = sinonTest.configureTest(sinon);

function getComponentProps(propsDescriptor) {
    let [componentDefaultProps, componentOverwrittenProps] = isArray(propsDescriptor) ? // eslint-disable-line prefer-const,max-len
        propsDescriptor :
        [propsDescriptor];

    if (isArray(componentDefaultProps)) {
        componentDefaultProps = getComponentProps(componentDefaultProps);
    }

    if (isArray(componentOverwrittenProps)) {
        componentOverwrittenProps = getComponentProps(componentOverwrittenProps);
    }

    return assign({}, componentDefaultProps, componentOverwrittenProps);
}

function createComponentInstance(componentConstructor, { props: propsDescriptor }) {
    const ComponentConstructor = componentConstructor;
    return React.createElement(ComponentConstructor, getComponentProps(propsDescriptor));
}

function mountComponentInstance(...args) {
    return mount(createComponentInstance(...args));
}

function renderComponentInstance(...args) {
    return render(createComponentInstance(...args));
}

function shallowRenderComponentInstance(...args) {
    return shallow(createComponentInstance(...args));
}

function getStubFake(stubReturns) {
    let returnedFake;

    if (stubReturns === 'element') {
        [returnedFake] = generateJSXFakes();
    } else if (stubReturns === 'string') {
        [returnedFake] = generateStringFakes();
    } else if (stubReturns === 'number') {
        [returnedFake] = generateNumberFakes();
    } else {
        returnedFake = stubReturns;
    }

    return returnedFake;
}

function enhanceStub(stubToEnhance, stubEnhancer, stubReturns) {
    let enhancedStub;
    let enhancedStubReturn;

    if (stubEnhancer === EMPTY_ENHANCER) {
        stubEnhancer = stubReturns;
    }

    if (isFunction(stubEnhancer)) {
        enhancedStub = stubEnhancer(stubToEnhance);
    } else {
        const returnedFake = getStubFake(stubEnhancer);

        enhancedStubReturn = returnedFake;
        enhancedStub = stubToEnhance.returns(returnedFake);
    }

    return {
        enhancedStub,
        enhancedStubReturn
    };
}

function enhanceStubs({
    sinonRuntime,
    stubsDescriptor,
    stubReturns,
    stubEnhancerFn,
    isBound
}) {
    const enhancedStubs = {};
    const enhancedStubsReturns = {};

    forEach(stubsDescriptor, (stubDescriptor, stubName) => {
        const { enhancedStub, enhancedStubReturn } = stubEnhancerFn({
            sinonRuntime,
            stubName,
            stubReturns,
            // Note that descriptor is passed as enhancer
            stubEnhancer: stubDescriptor,
            isBound
        });

        enhancedStubs[stubName] = enhancedStub;
        enhancedStubsReturns[stubName] = enhancedStubReturn;
    });

    return {
        enhancedStubs,
        enhancedStubsReturns
    };
}

function stubPrototypeMethod(sinonRuntime, componentConstructor, componentMethod) {
    return sinonRuntime.stub(componentConstructor.prototype, componentMethod);
}

function stubPrototypeMethodBound(sinonRuntime, componentConstructor, componentMethod) {
    const methodStub = stubPrototypeMethod(sinonRuntime, componentConstructor, componentMethod);
    return sinonRuntime.stub(methodStub, 'bind');
}

function stubModuleExport({
    sinonRuntime,
    stubEnhancer,
    stubReturns,
    isBound
}) {
    const stubbedExport = isBound ? sinonRuntime.stub(sinonRuntime.stub(), 'bind') : sinonRuntime.stub();
    return enhanceStub(stubbedExport, stubEnhancer, stubReturns);
}

function stubComponentProp({
    sinonRuntime,
    stubEnhancer,
    stubReturns,
    isBound
}) {
    const stubbedExport = isBound ? sinonRuntime.stub(sinonRuntime.stub(), 'bind') : sinonRuntime.stub();
    return enhanceStub(stubbedExport, stubEnhancer, stubReturns);
}

function stubComponentMethod(componentConstructor, {
    sinonRuntime,
    stubName: methodName,
    stubEnhancer,
    stubReturns,
    isBound
}) {
    const stubMethod = isBound ? stubPrototypeMethodBound : stubPrototypeMethod;
    const stubbedMethod = stubMethod(sinonRuntime, componentConstructor, methodName);

    return enhanceStub(stubbedMethod, stubEnhancer, stubReturns);
}

function stubModuleExports({
    sinonRuntime,
    moduleDescriptor = {},
    dependencyReturns,
    isBound
}) {
    const { enhancedStubs, enhancedStubsReturns } = enhanceStubs({
        sinonRuntime,
        stubsDescriptor: moduleDescriptor,
        stubReturns: dependencyReturns,
        stubEnhancerFn: stubModuleExport,
        isBound
    });

    return {
        moduleExportsStubs: enhancedStubs,
        moduleExportsReturns: enhancedStubsReturns
    };
}

function stubComponentProps({
    sinonRuntime,
    propsDescriptor = {},
    propReturns,
    isBound
}) {
    const { enhancedStubs, enhancedStubsReturns } = enhanceStubs({
        sinonRuntime,
        stubsDescriptor: propsDescriptor,
        stubReturns: propReturns,
        stubEnhancerFn: stubComponentProp,
        isBound
    });

    return {
        propsStubs: enhancedStubs,
        propsReturns: enhancedStubsReturns
    };
}

function stubComponentMethods(componentConstructor, {
    sinonRuntime,
    methodsDescriptor = {},
    methodReturns,
    isBound
}) {
    const { enhancedStubs, enhancedStubsReturns } = enhanceStubs({
        sinonRuntime,
        stubsDescriptor: methodsDescriptor,
        stubReturns: methodReturns,
        stubEnhancerFn: partial(stubComponentMethod, componentConstructor),
        isBound
    });

    return {
        methodsStubs: enhancedStubs,
        methodsReturns: enhancedStubsReturns
    };
}

function stubComponentDependencies({
    sinonRuntime,
    dependenciesDescriptor = {},
    dependencyReturns,
    isBound
}) {
    const dependenciesStubs = {};
    const dependenciesReturns = {};

    forEach(dependenciesDescriptor, (moduleDescriptor, moduleName) => {
        // If descriptor is a plain object or array, assuming that we're stubbing named exports
        if (isPlainObject(moduleDescriptor) || isArray(moduleDescriptor)) {
            const { moduleExportsStubs, moduleExportsReturns } = stubModuleExports({
                sinonRuntime,
                moduleDescriptor,
                dependencyReturns,
                isBound
            });

            dependenciesStubs[moduleName] = moduleExportsStubs;
            dependenciesReturns[moduleName] = moduleExportsReturns;
        // Otherwise, we assume that we're stubbing default export, and providing enhancer on top of it
        } else {
            const { enhancedStub, enhancedStubReturn } = stubModuleExport({
                sinonRuntime,
                isBound,
                // moduleDescriptor acts like stub enhancler in this case
                stubEnhancer: moduleDescriptor,
            });

            dependenciesStubs[moduleName] = enhancedStub;
            dependenciesReturns[moduleName] = enhancedStubReturn;
        }
    });

    return {
        dependenciesStubs,
        dependenciesReturns
    };
}

function prepareComponentDependencies({
    sinonRuntime,
    componentConstructor,
    componentModule,

    dependencyReturns,
    injectedDependencies,
    injectedBoundDependencies
}) {
    const componentName = componentConstructor.name;
    let allDependenciesStubs = {};
    let allDependenciesReturns = {};

    if (injectedDependencies) {
        const { dependenciesStubs, dependenciesReturns } = stubComponentDependencies({
            sinonRuntime,
            dependenciesDescriptor: injectedDependencies,
            dependencyReturns
        });

        allDependenciesStubs = assign(allDependenciesStubs, { ...dependenciesStubs });
        allDependenciesReturns = assign(allDependenciesReturns, { ...dependenciesReturns });
    }

    if (injectedBoundDependencies) {
        const { dependenciesStubs: boundDependenciesStubs, allDependenciesReturns: boundDependenciesReturns } =
            stubComponentDependencies({
                sinonRuntime,
                dependenciesDescriptor: injectedDependencies,
                dependencyReturns,
                isBound: true
            });

        allDependenciesStubs = assign(allDependenciesStubs, { ...boundDependenciesStubs });
        allDependenciesReturns = assign(allDependenciesReturns, { ...boundDependenciesReturns });
    }

    return {
        componentConstructor: componentModule(allDependenciesStubs)[componentName] ||
            componentModule(allDependenciesStubs)['default'],
        dependenciesStubs: allDependenciesStubs,
        dependenciesReturns: allDependenciesReturns
    };
}

function prepareComponentProps({
    sinonRuntime,

    propReturns,
    stubbedProps,
    stubbedBoundProps
}) {
    let allPropsStubs = {};
    let allPropsReturns = {};

    if (stubbedProps) {
        const { propsStubs, propsReturns } = stubComponentProps({
            sinonRuntime,
            propsDescriptor: stubbedProps,
            propReturns
        });

        allPropsStubs = assign(allPropsStubs, { ...propsStubs });
        allPropsReturns = assign(allPropsReturns, { ...propsReturns });
    }

    if (stubbedBoundProps) {
        const { propsStubs: boundPropsStubs, propsReturns: boundPropsReturns } =
            stubComponentProps({
                sinonRuntime,
                propsDescriptor: stubbedBoundProps,
                propReturns,
                isBound: true
            });

        allPropsStubs = assign(allPropsStubs, { ...boundPropsStubs });
        allPropsReturns = assign(allPropsReturns, { ...boundPropsReturns });
    }

    return {
        propsStubs: allPropsStubs,
        propsReturns: allPropsReturns
    };
}

function prepareComponentMethods({
    sinonRuntime,

    componentConstructor,
    methodReturns,
    stubbedMethods,
    stubbedBoundMethods
}) {
    let allMethodsStubs = {};
    let allMethodsReturns = {};

    if (stubbedMethods) {
        // Order is important, stubs should be instantiated before component is rendered!
        const { methodsStubs, methodsReturns } = stubComponentMethods(componentConstructor, {
            sinonRuntime,
            methodsDescriptor: stubbedMethods,
            methodReturns
        });

        allMethodsStubs = assign(allMethodsStubs, { ...methodsStubs });
        allMethodsReturns = assign(allMethodsReturns, { ...methodsReturns });
    }

    if (stubbedBoundMethods) {
        const { methodsStubs: boundMethodsStubs, methodsReturns: boundMethodsReturns } =
            stubComponentMethods(componentConstructor, {
                sinonRuntime,
                methodsDescriptor: stubbedBoundMethods,
                methodReturns,
                isBound: true
            });

        allMethodsStubs = assign(allMethodsStubs, { ...boundMethodsStubs });
        allMethodsReturns = assign(allMethodsReturns, { ...boundMethodsReturns });
    }

    return {
        methodsStubs: allMethodsStubs,
        methodsReturns: allMethodsReturns
    };
}

function prepareComponent(componentConstructor, {
    sinonRuntime,
    module: componentModule,

    dependencyReturns,
    propReturns,
    methodReturns,

    injectedDependencies,
    injectedBoundDependencies,

    stubbedProps,
    stubbedBoundProps,

    stubbedMethods,
    stubbedBoundMethods
}) {
    let instanceConstructor = componentConstructor;
    let preparedComponent = {};

    if (injectedDependencies || injectedBoundDependencies) {
        const preparedDependencies = prepareComponentDependencies({
            sinonRuntime,
            componentConstructor,
            componentModule,

            dependencyReturns,
            injectedDependencies,
            injectedBoundDependencies
        });

        // Note that we're overwriting component consturctor, if we have at least one injected dependency
        instanceConstructor = preparedDependencies.componentConstructor;
        preparedComponent = assign({}, preparedComponent, preparedDependencies);
    }

    if (stubbedProps || stubbedBoundProps) {
        const preparedProps = prepareComponentProps({
            sinonRuntime,

            propReturns,
            stubbedProps,
            stubbedBoundProps
        });

        preparedComponent = assign({}, preparedComponent, preparedProps);
    }

    if (stubbedMethods || stubbedBoundMethods) {
        const preparedMethods = prepareComponentMethods({
            sinonRuntime,
            // we need to replace original component constructor with a constuctor, which might have
            // been replaced during dependencies injections
            componentConstructor: instanceConstructor,

            methodReturns,
            stubbedMethods,
            stubbedBoundMethods
        });

        preparedComponent = assign({}, preparedComponent, preparedMethods);
    }

    return assign(preparedComponent, { instanceConstructor });
}

function getPublicInterface(componentConstructor, options = {}, wrapperCreator) {
    const preparedComponent = prepareComponent(componentConstructor, options);
    // If dependencies are injected, the constructor, which is used to create instance will be different,
    // than provided constructor, that's why we need to create a different wrapper
    const { instanceConstructor, propsStubs } = preparedComponent;
    const publicOptions = omit(preparedComponent, 'instanceConstructor');

    return assign({}, publicOptions, {
        wrapper: wrapperCreator(instanceConstructor, {
            // Assigning of the props stubs should happen during the process of creating component instance
            props: [options.props, propsStubs]
        })
    });
}

function generateSandboxedTest(componentConstructor, setupOptions) {
    return sinon.test(function({ assertFn, assertOptions = {} }) {
        let result;
        const defaultProps = createTestSuite.defaultProps || {};
        const instanceOptions = assign({}, setupOptions, assertOptions, {
            sinonRuntime: this,
            props: [[defaultProps, setupOptions.props], assertOptions.props],

            stubbedProps: mergeStubsDescriptors(
                setupOptions.stubbedProps,
                assertOptions.stubbedProps,
            ),
            stubbedBoundProps: mergeStubsDescriptors(
                setupOptions.stubbedBoundProps,
                assertOptions.stubbedBoundProps,
            ),

            stubbedMethods: mergeStubsDescriptors(
                setupOptions.stubbedMethods,
                assertOptions.stubbedMethods,
            ),
            stubbedBoundMethods: mergeStubsDescriptors(
                setupOptions.stubbedBoundMethods,
                assertOptions.stubbedBoundMethods,
            ),

            injectedDependencies: mergeDependenciesDescriptors(
                setupOptions.injectedDependencies,
                assertOptions.injectedDependencies,
            ),
            injectedBoundDependencies: mergeDependenciesDescriptors(
                setupOptions.injectedBoundDependencies,
                assertOptions.injectedBoundDependencies,
            )
        });

        // .setOption('mount', true)
        // .setOption('render', true)
        if (instanceOptions.mount) {
            result = mountComponent(componentConstructor, instanceOptions);
        } else if (instanceOptions.render) {
            result = renderComponent(componentConstructor, instanceOptions);
        } else {
            result = shallowRenderComponent(componentConstructor, instanceOptions);
        }

        assertFn(result);
    });
}

export function renderComponent(componentConstructor, options) {
    return getPublicInterface(componentConstructor, options, renderComponentInstance);
}

export function mountComponent(componentConstructor, options = {}) {
    return getPublicInterface(componentConstructor, options, mountComponentInstance);
}

export function shallowRenderComponent(componentConstructor, options = {}) {
    return getPublicInterface(componentConstructor, options, shallowRenderComponentInstance);
}

export function createTestSuite(componentConstructor, setupOptions = {}) {
    const sandboxedTest = generateSandboxedTest(componentConstructor, setupOptions);

    if (isFunction(setupOptions.assert)) {
        sandboxedTest.call({}, { assertFn: setupOptions.assert });
    } else {
        return new TestSuite(sandboxedTest);
    }
}

export function extendTestSuite({ assertFunctions }) {
    forEach(assertFunctions, (extensionCreator, extensionName) => {
        // May potentially throw or warn
        if (!TestSuite.prototype[extensionName]) {
            TestSuite.prototype[extensionName] = function(extensionArguments) {
                const { setup, assert } = extensionCreator(extensionArguments);
                const preparedTestSuite = setup(this);

                preparedTestSuite.assert(assert);
            };
        }
    });
}

export { generateJSXFakes, generateStringFakes, generateNumberFakes } from './helpers';

extendTestSuite({
    assertFunctions: {
        testReduxAction,
        testLink,
        testEvent
    }
});
