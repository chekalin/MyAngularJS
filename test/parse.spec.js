/* jshint globalstrict: true */
/* global parse: false */
/* global it, expect, describe, beforeEach: false */
"use strict";

describe("parse", function () {

    it("can parse an integer", function () {
        var fn = parse('42');
        expect(fn).toBeDefined();
        expect(fn()).toBe(42);
    });

    it("makes integers both constant and literal", function () {
        var fn = parse('42');
        expect(fn.constant).toBe(true);
        expect(fn.literal).toBe(true);
    });

    it("can parse a floating point number", function () {
        var fn = parse('4.2');
        expect(fn()).toBe(4.2);
    });

    it("can parse a floating point number without an integer part", function () {
        var fn = parse('.42');
        expect(fn()).toBe(0.42);
    });

    it("can parse a number in scientific notation", function () {
        var fn = parse('42e3');
        expect(fn()).toBe(42000);
    });

    it("can parse a number in scientific notation with float coefficient", function () {
        var fn = parse('.42e3');
        expect(fn()).toBe(420);
    });

    it("can parse a number in scientific notation with negative exponents", function () {
        var fn = parse('4200e-2');
        expect(fn()).toBe(42);
    });

    it("can parse a number in scientific notation with the + sign", function () {
        var fn = parse('42e+2');
        expect(fn()).toBe(4200);
    });

    it("can parse uppercase scientific notation", function () {
        var fn = parse('.42E2');
        expect(fn()).toBe(42);
    });

    it("will not parse invalid scientific notation", function () {
        expect(function () {
            parse('42e-');
        }).toThrow();
        expect(function () {
            parse('42e-a');
        }).toThrow();
    });

    it("can parse a string in single quotes", function () {
        var fn = parse("'abc'");
        expect(fn()).toEqual('abc');
    });

    it("can parse a string in double quotes", function () {
        var fn = parse('"abc"');
        expect(fn()).toEqual('abc');
    });

    it("will not parse a string with mismatching quotes", function () {
        expect(function () {
            parse('"abc\'');
        }).toThrow();
    });

    it("marks strings as literal and constant", function () {
        var fn = parse('"abc"');
        expect(fn.literal).toBe(true);
        expect(fn.constant).toBe(true);
    });

    it("will parse a string with character escapes", function () {
        var fn = parse('"\\n\\r\\\\"');
        expect(fn()).toEqual('\n\r\\');
    });

    it("will parse a string with unicode escapes", function () {
        var fn = parse('"\\u00A0"');
        expect(fn()).toEqual('\u00A0');
    });

    it("will not parse a string with invalid unicode escapes", function () {
        expect(function () {
            parse('"\\u00T0"');
        }).toThrow();
    });

    it("will parse null", function () {
        var fn = parse("null");
        expect(fn()).toBe(null);
    });

    it("will parse true", function () {
        var fn = parse("true");
        expect(fn()).toBe(true);
    });

    it("will parse false", function () {
        var fn = parse("false");
        expect(fn()).toBe(false);
    });

    it("marks booleans as literals and constant", function () {
        var fn = parse('true');
        expect(fn.literal).toBe(true);
        expect(fn.constant).toBe(true);
    });

    it("marks null as literals and constant", function () {
        var fn = parse('null');
        expect(fn.literal).toBe(true);
        expect(fn.constant).toBe(true);
    });

    it("ignores whitespace", function () {
        var fn = parse(' \n42 ');
        expect(fn()).toBe(42);
    });

    it("will parse an empty array", function () {
        var fn = parse('[]');
        expect(fn()).toEqual([]);
    });

    it("will parse a non-empty array", function () {
        var fn = parse('[1, "two",[3]]');
        expect(fn()).toEqual([1, 'two', [3]]);
    });

    it("will parse an array with trailing commas", function () {
        var fn = parse('[1, 2, 3, ]');
        expect(fn()).toEqual([1, 2, 3]);
    });

    it("marks array literals as literal and constant", function () {
        var fn = parse('[1, 2, 3]');
        expect(fn.literal).toBe(true);
        expect(fn.constant).toBe(true);
    });

    it("will parse an empty object", function () {
        var fn = parse("{}");
        expect(fn()).toEqual({});
    });

    it("will parse non-empty object", function () {
        var fn = parse('{a: 1, b: [2, 3], c: {d: 4}}');
        expect(fn()).toEqual({a: 1, b: [2, 3], c: {d: 4}});
    });

    it("will parse an object with string keys", function () {
        var fn = parse('{"a key": 1, \'another-key\': 2}');
        expect(fn()).toEqual({'a key': 1, 'another-key': 2});
    });

    it("looks up an attribute from the scope", function () {
        var fn = parse("aKey");
        expect(fn({aKey: 42})).toBe(42);
        expect(fn({})).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it("looks up a 2-part identifier path from the scope", function () {
        var fn = parse("aKey.anotherKey");
        expect(fn({aKey: {anotherKey: 42}})).toBe(42);
        expect(fn({})).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it("looks up a 4-part identifier path from the scope", function () {
        var fn = parse("aKey.secondKey.thirdKey.fourthKey");
        expect(fn({aKey: {secondKey: {thirdKey: {fourthKey: 42}}}})).toBe(42);
        expect(fn({aKey: {secondKey: {thirdKey: {}}}})).toBeUndefined();
        expect(fn({aKey: {}})).toBeUndefined();
        expect(fn()).toBeUndefined();
    });

    it("uses locals instead of scope when there is matching key", function () {
        var fn = parse('aKey');
        expect(fn({aKey: 42}, {aKey: 43})).toBe(43);
    });

    it("does not use locals instead of scope when no matching key", function () {
        var fn = parse('aKey');
        expect(fn({aKey: 42}, {otherKey: 43})).toBe(42);
    });

    it("uses locals when a two-part key matches in locals", function () {
        var fn = parse('aKey.anotherKey');
        expect(fn(
            {aKey: {anotherKey: 42}},
            {aKey: {anotherKey: 43}}
        )).toBe(43);
    });

    it("does not use locals when 2-part key does not mathch", function () {
        var fn = parse('aKey.anotherKey');
        expect(fn(
            {aKey: {anotherKey: 42}},
            {otherKey: {anotherKey: 43}}
        )).toBe(42);
    });

    it("uses locals instead of scope when the first part matches", function () {
        var fn = parse('aKey.anotherKey');
        expect(fn(
            {aKey: {anotherKey: 42}},
            {aKey: {}}
        )).toBeUndefined();
    });

    it("uses locals when there is a matching local 4-part key", function () {
        var fn = parse('aKey.key2.key3.key4');
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {aKey: {key2: {key3: {key4: 43}}}}
        )).toBe(43);
    });

    it("does not use locals when there is no matching 4-part key", function () {
        var fn = parse('aKey.key2.key3.key4');
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {otherKey: {anotherKey: 43}}
        )).toBe(42);
    });

    it("uses locals when there is the first part in local key", function () {
        var fn = parse('aKey.key2.key3.key4');
        expect(fn(
            {aKey: {key2: {key3: {key4: 42}}}},
            {aKey: {}}
        )).toBeUndefined();
    });

});