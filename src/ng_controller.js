/* exported ngControllerDirective */

function ngControllerDirective() {
    'use strict';

    return {
        restrict: 'A',
        scope: true,
        controller: '@'
    }
}
