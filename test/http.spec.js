/* global jasmine, it, expect, describe, beforeEach, afterEach, sinon */
/* global publishExternalAPI, createInjector */

describe('$http', function () {
    'use strict';

    var $http;
    var xhr, requests;

    beforeEach(function () {
        publishExternalAPI();
        var injector = createInjector(['ng']);
        $http = injector.get('$http');
    });

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };
    });

    afterEach(function () {
        xhr.restore();
    });

    it('is a function', function () {
        expect($http instanceof Function).toBe(true);
    });

    it('returns a promise', function () {
        var result = $http({});
        expect(result).toBeDefined();
        expect(result.then).toBeDefined();
    });

    it('makes an XMLHttpRequest to given URL', function () {
        $http({
            method: 'POST',
            url: 'http://teropa.info',
            data: 'hello'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe('http://teropa.info');
        expect(requests[0].async).toBe(true);
        expect(requests[0].requestBody).toBe('hello');
    });

    it('resolves promise when XHR result received', function () {
        var requestConfig = {
            method: 'GET',
            url: 'http://teropa.info'
        };

        var response;
        $http(requestConfig).then(function (r) {
            console.log('Response: ' + r);
            response = r;
        });

        requests[0].respond(200, {}, 'Hello');

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.statusText).toBe('OK');
        expect(response.data).toBe('Hello');
        expect(response.config.url).toBe('http://teropa.info');
    });

});