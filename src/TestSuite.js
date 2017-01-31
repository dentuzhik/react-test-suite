import { assign } from 'lodash';
import { mergeStubsDescriptors, mergeDependenciesDescriptors } from './helpers';

export default class TestSuite {
    constructor(sandboxedTest) {
        this.sandboxedTest = sandboxedTest;
        this.assertOptions = {};
    }

    setOption(key, value) {
        this.assertOptions[key] = value;
        return this;
    }

    setOptions(options) {
        this.assertOptions = assign({}, this.assertOptions, options);
        return this;
    }

    prop(propName, propValue) {
        return this.props({ [propName]: propValue });
    }

    props(propsDescriptor) {
        return this.setOption('props', [this.assertOptions.props, propsDescriptor]);
    }

    stubProp(propName, stubEnhancer) {
        return stubEnhancer ?
            this.stubProps({ [propName]: stubEnhancer }) :
            this.stubProps([propName]);
    }

    stubBoundProp(propName, stubEnhancer) {
        return stubEnhancer ?
            this.stubBoundProps({ [propName]: stubEnhancer }) :
            this.stubBoundProps([propName]);
    }

    stubProps(propsDescriptor) {
        return this.setOption(
            'stubbedProps',
            mergeStubsDescriptors(
                this.assertOptions.stubbedProps,
                propsDescriptor
            )
        );
    }

    stubBoundProps(propsDescriptor) {
        return this.setOption(
            'stubbedBoundProps',
            mergeStubsDescriptors(
                this.assertOptions.stubbedBoundProps,
                propsDescriptor
            )
        );
    }

    stubMethod(methodName, stubEnhancer) {
        return stubEnhancer ?
            this.stubMethods({ [methodName]: stubEnhancer }) :
            this.stubMethods([methodName]);
    }

    stubBoundMethod(methodName, stubEnhancer) {
        return stubEnhancer ?
            this.stubBoundMethods({ [methodName]: stubEnhancer }) :
            this.stubBoundMethods([methodName]);
    }

    stubMethods(methodsDescriptor) {
        return this.setOption(
            'stubbedMethods',
            mergeStubsDescriptors(
                this.assertOptions.stubbedMethods,
                methodsDescriptor
            )
        );
    }

    stubBoundMethods(methodsDescriptor) {
        return this.setOption(
            'stubbedBoundMethods',
            mergeStubsDescriptors(
                this.assertOptions.stubbedBoundMethods,
                methodsDescriptor
            )
        );
    }

    injectDependencies(dependenciesDescriptor) {
        return this.setOption(
            'injectedDependencies',
            mergeDependenciesDescriptors(
                this.assertOptions.injectedDependencies,
                dependenciesDescriptor
            )
        );
    }

    injectBoundDependencies(dependenciesDescriptor) {
        return this.setOption(
            'injectedBoundDependencies',
            mergeDependenciesDescriptors(
                this.assertOptions.injectedBoundDependencies,
                dependenciesDescriptor
            )
        );
    }

    assert(assertFn) {
        this.sandboxedTest.call({}, { assertFn, assertOptions: this.assertOptions });
    }
}
