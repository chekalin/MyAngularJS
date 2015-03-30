/* jshint globalstrict: true */
/* global parse: false */
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
});