import uuid from 'node-uuid';
import {
    range,
    random,
    assign,
    forEach,
    mergeWith,
    isArray,
    isEmpty,
    isString,
    isFunction,
    isObjectLike,
    isPlainObject
} from 'lodash';

export const EMPTY_ENHANCER = 'EMPTY';

/**
 * Generate array of random strings (uuids)
 * @param number numberOfFakes - number of fakes to return in array
 * @returns {Array.<string>}
 */
export function generateStringFakes(numberOfFakes = 10) {
    return range(numberOfFakes).map(() => uuid());
}

/**
 * Generate array of JSX divs with uuids as key and contents
 * @param number numberOfFakes - number of fakes to return in array
 * @returns {Array.<JSX>}
 */
export function generateJSXFakes(numberOfFakes = 10) {
    return range(numberOfFakes).map(() => {
        const id = uuid();
        return <div key={id}>{id}</div>;
    });
}

/**
 * Generate array of random whole numbers between min (inclusive) and max (inclusive)
 * @param number numberOfFakes - number of fakes to return in array
 * @param number min - inclusive lower bound of generated numbers
 * @param number max - inclusive upper bound of generated numbers
 * @param boolean floating - whether or not to return a floating point number
 * @returns {Array.<number>}
 */
export function generateNumberFakes(numberOfFakes = 10, min = 1, max = 10, floating = false) {
    return range(numberOfFakes).map(() => {
        return random(min, max, floating);
    });
}

export function normalizeStubDescriptor(stubDescriptor) {
    if (isArray(stubDescriptor)) {
        let returnValue = {};

        forEach(stubDescriptor, descriptorEntry => {
            if (isString(descriptorEntry)) {
                // The reason to use a constant - is to be able to differentiate array entry of stubDescriptor
                returnValue[descriptorEntry] = EMPTY_ENHANCER;
            } else if (isPlainObject(descriptorEntry)) {
                returnValue = assign({}, returnValue, descriptorEntry);
            }
        });

        return returnValue;
    } else if (isPlainObject(stubDescriptor)) {
        return stubDescriptor;
    }
}

export function mergeStubsDescriptors(existingDescriptors = {}, overwrittenDescriptors = {}) {
    // isObjectLike acts like a check for either arrray or plain object
    if (isObjectLike(existingDescriptors) && isObjectLike(overwrittenDescriptors)) {
        const mergedDescriptors = assign(
            {},
            normalizeStubDescriptor(existingDescriptors),
            normalizeStubDescriptor(overwrittenDescriptors)
        );

        // There're conditional checks that require a falsy value instead of the defaut return
        // of lodash, which is an empty object
        return isEmpty(mergedDescriptors) ? undefined : mergedDescriptors;
    // This is a special case to handle the module descriptor for the default export stub
    } else if (isFunction(overwrittenDescriptors)) {
        return overwrittenDescriptors;
    }
}

export function mergeDependenciesDescriptors(existingDescriptors = {}, overwrittenDescriptors = {}) {
    const mergedDescriptor = mergeWith(existingDescriptors, overwrittenDescriptors, mergeStubsDescriptors);
    // There're conditional checks that require a falsy value instead of the defaut return
    // of lodash, which is an empty object
    return isEmpty(mergedDescriptor) ? undefined : mergedDescriptor;
}
