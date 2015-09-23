/* global publishExternalAPI, createInjector */

describe('$interpolate', function () {
    'use strict';

    beforeEach(function () {
        delete window.angular;
        publishExternalAPI();
    });

    it('exists', function () {
        var injector = createInjector(['ng']);
        expect(injector.has('$interpolate')).toBe(true);
    });

    it('produces an identity function for static content', function () {
        var injector = createInjector(['ng']);
        var $interpolate = injector.get('$interpolate');

        var interp = $interpolate('hello');
        expect(interp instanceof Function).toBe(true);
        expect(interp()).toEqual('hello');
    });

    it('evaluates a single expression', function () {
        var injector = createInjector(['ng']);
        var $interpolate = injector.get('$interpolate');

        var interp = $interpolate('{{anAttr}}');
        expect(interp({anAttr: '42'})).toEqual('42');
    });

    it('evaluates many expressions', function () {
        var injector = createInjector(['ng']);
        var $interpolate = injector.get('$interpolate');

        var interp = $interpolate('First {{anAttr}}, then {{anotherAttr}}!');
        var context = {anAttr: '42', anotherAttr: '43'};
        expect(interp(context)).toEqual('First 42, then 43!');
    });

});
