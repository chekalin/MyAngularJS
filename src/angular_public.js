/* global angular, setupModuleLoader, $ParseProvider, $RootScopeProvider, $QProvider, $$QProvider */
/* global $HttpBackendProvider, $HttpProvider, $CompileProvider */
/* global $ControllerProvider */
/* exported publishExternalAPI */

function publishExternalAPI() {
    'use strict';

    setupModuleLoader(window);

    var ngModule = angular.module('ng', []);
    ngModule.provider('$parse', $ParseProvider);
    ngModule.provider('$rootScope', $RootScopeProvider);
    ngModule.provider('$q', $QProvider);
    ngModule.provider('$$q', $$QProvider);
    ngModule.provider('$httpBackend', $HttpBackendProvider);
    ngModule.provider('$http', $HttpProvider);
    ngModule.provider('$compile', $CompileProvider);
    ngModule.provider('$controller', $ControllerProvider);
}
