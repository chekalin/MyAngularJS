/* jshint globalstrict: true */
'use strict';

function setupModuleLoader(window) {
    function ensure(obj, name, factory) {
        return (obj[name] = obj[name] || factory());
    }

    var angular = ensure(window, 'angular', Object);
    var createModule = function (name, requires, modules) {
        if (name === 'hasOwnProperty') {
            throw 'hasOwnProperty is not a valid module name';
        }
        var invokeQueue = [];
        var invokeLater = function (method) {
            return function () {
                invokeQueue.push([method, arguments]);
                return moduleInstance;
            };
        };
        var moduleInstance = {
            name: name,
            requires: requires,
            constant: invokeLater('constant'),
            _invokeQueue: invokeQueue,
            provider: invokeLater('provider')
        };
        modules[name] = moduleInstance;
        return moduleInstance;
    };

    var getModule = function (name, modules) {
        if (modules.hasOwnProperty(name)) {
            return modules[name];
        } else {
            throw 'Module ' + name + ' is not available!';
        }
    };

    ensure(angular, 'module', function () {
        var modules = {};
        return function (name, requires) {
            if (requires) {
                return createModule(name, requires, modules);
            } else {
                return getModule(name, modules);
            }
        };
    });
}