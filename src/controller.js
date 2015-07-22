/* exported $ControllerProvider */
function $ControllerProvider() {
    'use strict';

    var controllers = {};
    var globals = false;

    this.allowGlobals = function () {
        globals = true;
    };

    this.register = function (name, controller) {
        if (_.isObject(name)) {
            _.assign(controllers, name);
        } else {
            controllers[name] = controller;
        }
    };

    this.$get = ['$injector', function ($injector) {
        return function (ctrl, locals) {
            if (_.isString(ctrl)) {
                if (controllers.hasOwnProperty(ctrl)) {
                    ctrl = controllers[ctrl];
                } else if (globals) {
                    ctrl = window[ctrl];
                }
            }
            return $injector.instantiate(ctrl, locals);
        };
    }];

}
