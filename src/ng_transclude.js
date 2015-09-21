/* exported ngTranscludeDirective */

function ngTranscludeDirective() {
    'use strict';

    return {
        restrict: 'EAC',
        link: function (scope, element, attrs, ctrl, transclude) {
            transclude(function (clone) {
                element.empty();
                element.append(clone);
            });
        }
    };
}
