function $CompileProvider($provide) {
    'use strict';

    var PREFIX_REGEXP = /(x[:\-_]|data[:\-_])/i;

    function directiveNormalize(name) {
        return _.camelCase(name.replace(PREFIX_REGEXP, ''));
    }

    var hasDirectives = {};

    this.directive = function (name, directiveFactory) {
        if (_.isString(name)) {
            if (name === 'hasOwnProperty') {
                throw 'hasOwnProperty is not a valid directive name';
            }
            if (!hasDirectives.hasOwnProperty(name)) {
                hasDirectives[name] = [];
                $provide.factory(name + 'Directive', ['$injector', function ($injector) {
                    var factories = hasDirectives[name];
                    return _.map(factories, function (factory) {
                        var directive = $injector.invoke(factory);
                        directive.restrict = directive.restrict || 'EA';
                        return directive;
                    });
                }]);
            }
            hasDirectives[name].push(directiveFactory);
        } else {
            _.forEach(name, function (directiveFactory, name) {
                this.directive(name, directiveFactory);
            }, this);
        }
    };

    this.$get = ["$injector", function ($injector) {
        function nodeName(element) {
            return element.nodeName ? element.nodeName : element[0].nodeName;
        }

        function addDirective(directives, name, mode) {
            if (hasDirectives.hasOwnProperty(name)) {
                var foundDirectives = $injector.get(name + 'Directive');
                var applicableDirectives = _.filter(foundDirectives, function (dir) {
                    return dir.restrict.indexOf(mode) !== -1;
                });
                directives.push.apply(directives, applicableDirectives);
            }
        }

        function collectDirectives(node) {
            var directives = [];
            if (node.nodeType === Node.ELEMENT_NODE) {
                var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
                addDirective(directives, normalizedNodeName, 'E');
                _.forEach(node.attributes, function (attr) {
                    var normalizedAttr = directiveNormalize(attr.name.toLowerCase());
                    if (/^ngAttr[A-Z]/.test(normalizedAttr)) {
                        normalizedAttr =
                            normalizedAttr[6].toLowerCase() +
                            normalizedAttr.substring(7);
                    }
                    addDirective(directives, normalizedAttr, 'A');
                });
                _.forEach(node.classList, function (cls) {
                    var normalizedClassName = directiveNormalize(cls);
                    addDirective(directives, normalizedClassName, 'C');
                });
            } else if (node.nodeType === Node.COMMENT_NODE) {
                var match = /^\s*directive:\s*([\d\w\-_]+)/.exec(node.nodeValue);
                if (match) {
                    addDirective(directives, directiveNormalize(match[1]), 'M');
                }
            }
            return directives;
        }

        function applyDirectivesToNode(directives, compileNode) {
            var $compileNode = $(compileNode);
            _.forEach(directives, function (directive) {
                if (directive.compile) {
                    directive.compile($compileNode);
                }
            });
        }

        function compileNodes($compileNodes) {
            _.forEach($compileNodes, function (node) {
                var directives = collectDirectives(node);
                applyDirectivesToNode(directives, node);
                if (node.childNodes && node.childNodes.length) {
                    compileNodes(node.childNodes);
                }
            });
        }

        function compile($compileNodes) {
            return compileNodes($compileNodes);
        }

        return compile;
    }];
}
$CompileProvider.$inject = ['$provide'];