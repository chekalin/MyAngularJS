/* global publishExternalAPI, createInjector */
/* global jasmine, it, expect, describe, beforeEach: false */

describe('$compile', function () {
    'use strict';

    beforeEach(function () {
        delete window.angular;
        publishExternalAPI();
    });

    it('allows creating directives', function () {
        var myModule = window.angular.module('myModule', []);
        myModule.directive('testing', function () {
        });
        var injector = createInjector(['ng', 'myModule']);

        expect(injector.has('testingDirective')).toBe(true);
    });

    it('allows creating many directives with the same name', function () {
        var myModule = window.angular.module('myModule', []);
        myModule.directive('testing', _.constant({d: 'one'}));
        myModule.directive('testing', _.constant({d: 'two'}));
        var injector = createInjector(['ng', 'myModule']);

        var result = injector.get('testingDirective');
        expect(result.length).toBe(2);
        expect(result[0].d).toEqual('one');
        expect(result[1].d).toEqual('two');
    });

    it('does not allow directive called hasOwnProperty', function () {
        var myModule = window.angular.module('myModule', []);
        myModule.directive('hasOwnProperty', _.noop);
        expect(function () {
            createInjector(['ng', 'myModule']);
        }).toThrow();
    });

    it('allows creating directives with object notation', function () {
        var myModule = window.angular.module('myModule', []);
        myModule.directive({
            a: _.noop,
            b: _.noop,
            c: _.noop
        });
        var injector = createInjector(['ng', 'myModule']);

        expect(injector.has('aDirective')).toBe(true);
        expect(injector.has('bDirective')).toBe(true);
        expect(injector.has('cDirective')).toBe(true);
    });

    function makeInjectorWithDirectives() {
        var args = arguments;
        return createInjector(['ng', function ($compileProvider) {
            $compileProvider.directive.apply($compileProvider, args);
        }]);
    }

    it('compiles element directives from a single element', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<my-directive></my-directive>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles element directives found from several elements', function () {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<my-directive></my-directive><my-directive></my-directive>');
            $compile(el);
            expect(el.eq(0).data('hasCompiled')).toBe(1);
            expect(el.eq(1).data('hasCompiled')).toBe(2);
        });
    });

    it('compiles element directives from child elements', function () {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div><my-directive></my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBeUndefined();
            expect(el.find('> my-directive').data('hasCompiled')).toBe(1);
        });
    });

    it('compiles nested directives', function () {
        var idx = 1;
        var injector = makeInjectorWithDirectives('myDir', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', idx++);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<my-dir><my-dir><my-dir/></my-dir></my-dir>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(1);
            expect(el.find('> my-dir').data('hasCompiled')).toBe(2);
            expect(el.find('> my-dir > my-dir').data('hasCompiled')).toBe(3);
        });
    });

    _.forEach(['x', 'data'], function (prefix) {
        _.forEach([':', '-', '_'], function (delim) {

            it('compiles element directives with ' + prefix + delim + ' prefix', function () {
                var injector = makeInjectorWithDirectives('myDir', function () {
                    return {
                        restrict: 'EACM',
                        compile: function (element) {
                            element.data('hasCompiled', true);
                        }
                    };
                });
                injector.invoke(function ($compile) {
                    var el = $('<' + prefix + delim + 'my-dir></' + prefix + delim + 'my-dir>');
                    $compile(el);
                    expect(el.data('hasCompiled')).toBe(true);
                });

            });
        });
    });

    it('compiles attribute directives', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });

        injector.invoke(function ($compile) {
            var el = $('<div my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles attribute directives with prefixes', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });

        injector.invoke(function ($compile) {
            var el = $('<div x:my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles several attribute directives in an element', function () {
        var injector = makeInjectorWithDirectives({
            myDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('secondCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function ($compile) {
            var el = $('<div my-directive my-second-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('secondCompiled')).toBe(true);
        });
    });

    it('compiles both element and attribute directives in an element', function () {
        var injector = makeInjectorWithDirectives({
            myDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('secondCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function ($compile) {
            var el = $('<my-directive my-second-directive></my-directive>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('secondCompiled')).toBe(true);
        });
    });

    it('compiles attribute directives with ng-attr prefix', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });

        injector.invoke(function ($compile) {
            var el = $('<div ng-attr-my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles attribute directives with data:ng-attr prefix', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });

        injector.invoke(function ($compile) {
            var el = $('<div data:ng-attr-my-directive></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles class directives', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div class="my-directive"></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles several class directives in an element', function () {
        var injector = makeInjectorWithDirectives({
            myDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('hasCompiled', true);
                    }
                };
            },
            mySecondDirective: function () {
                return {
                    restrict: 'EACM',
                    compile: function (element) {
                        element.data('secondCompiled', true);
                    }
                };
            }
        });

        injector.invoke(function ($compile) {
            var el = $('<div class="my-directive my-second-directive"></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
            expect(el.data('secondCompiled')).toBe(true);
        });
    });

    it('compiles class directives with prefixes', function () {
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    element.data('hasCompiled', true);
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div class="x-my-directive"></div>');
            $compile(el);
            expect(el.data('hasCompiled')).toBe(true);
        });
    });

    it('compiles a comment directive', function () {
        var hasCompiled;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                restrict: 'EACM',
                compile: function (element) {
                    hasCompiled = true;
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<!-- directive: my-directive -->');
            $compile(el);
            expect(hasCompiled).toBe(true);
        });
    });

    _.forEach({
        E: {element: true, attribute: false, class: false, comment: false},
        A: {element: false, attribute: true, class: false, comment: false},
        C: {element: false, attribute: false, class: true, comment: false},
        M: {element: false, attribute: false, class: false, comment: true},
        EA: {element: true, attribute: true, class: false, comment: false},
        AC: {element: false, attribute: true, class: true, comment: false},
        EAM: {element: true, attribute: true, class: false, comment: true},
        EACM: {element: true, attribute: true, class: true, comment: true}
    }, function (expected, restrict) {
        describe('restricted to ' + restrict, function () {
            _.forEach({
                element: '<my-directive></my-directive>',
                attribute: '<div my-directive></div>',
                class: '<div class="my-directive"></div>',
                comment: '<!-- directive: my-directive -->',
            }, function (dom, type) {
                it((expected[type] ? 'matches' : 'does not match') + ' on ' + type, function () {
                    var hasCompiled = false;
                    var injector = makeInjectorWithDirectives('myDirective', function () {
                        return {
                            restrict: restrict,
                            compile: function (element) {
                                hasCompiled = true;
                            }
                        };
                    });
                    injector.invoke(function ($compile) {
                        var el = $(dom);
                        $compile(el);
                        expect(hasCompiled).toBe(expected[type]);
                    });
                });
            });
        });
    });

    it('applies to attributes when no restrict given', function () {
        var hasCompiled = false;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                compile: function (element) {
                    hasCompiled = true;
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div my-directive></div>');
            $compile(el);
            expect(hasCompiled).toBe(true);
        });
    });

    it('applies to elements when no restrict given', function () {
        var hasCompiled = false;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                compile: function (element) {
                    hasCompiled = true;
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<my-directive></my-directive>');
            $compile(el);
            expect(hasCompiled).toBe(true);
        });
    });

    it('does not apply to classes when no restrict given', function () {
        var hasCompiled = false;
        var injector = makeInjectorWithDirectives('myDirective', function () {
            return {
                compile: function (element) {
                    hasCompiled = true;
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div classs="my-directive"></div>');
            $compile(el);
            expect(hasCompiled).toBe(false);
        });
    });

    it('applies in priority order', function () {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            lowerDirective: function () {
                return {
                    priority: 1,
                    compile: function () {
                        compilations.push('lower');
                    }
                };
            },
            higherDirective: function () {
                return {
                    priority: 2,
                    compile: function () {
                        compilations.push('higher');
                    }
                };
            }
        });
        injector.invoke(function ($compile) {
            var el = $('<div lower-directive higher-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['higher', 'lower']);
        });
    });

    it('applies in alphabetic order when priorities are the ame', function () {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            firstDirective: function () {
                return {
                    priority: 1,
                    compile: function () {
                        compilations.push('first');
                    }
                };
            },
            secondDirective: function () {
                return {
                    priority: 1,
                    compile: function () {
                        compilations.push('second');
                    }
                };
            }
        });
        injector.invoke(function ($compile) {
            var el = $('<div second-directive first-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });

    it('applies in registration order when names are the same', function () {
        var compilations = [];
        var myModule = window.angular.module('myModule', []);
        myModule.directive('aDirective', function () {
            return {
                priority: 1,
                compile: function () {
                    compilations.push('first');
                }
            };
        });
        myModule.directive('aDirective', function () {
            return {
                priority: 1,
                compile: function () {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function ($compile) {
            var el = $('<div a-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });

    it('uses default priority when one not given', function () {
        var compilations = [];
        var myModule = window.angular.module('myModule', []);
        myModule.directive('firstDirective', function () {
            return {
                priority: 1,
                compile: function () {
                    compilations.push('first');
                }
            };
        });
        myModule.directive('secondDirective', function () {
            return {
                compile: function () {
                    compilations.push('second');
                }
            };
        });
        var injector = createInjector(['ng', 'myModule']);
        injector.invoke(function ($compile) {
            var el = $('<div second-directive first-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });

    it('stops compiling at a terminal directive', function () {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            firstDirective: function () {
                return {
                    priority: 1,
                    terminal: true,
                    compile: function () {
                        compilations.push('first');
                    }
                };
            },
            secondDirective: function () {
                return {
                    priority: 0,
                    compile: function () {
                        compilations.push('second');
                    }
                };
            }
        });
        injector.invoke(function ($compile) {
            var el = $('<div first-directive second-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['first']);
        });
    });

    it('still compiles directives with same priority after terminal', function () {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            firstDirective: function () {
                return {
                    priority: 1,
                    terminal: true,
                    compile: function () {
                        compilations.push('first');
                    }
                };
            },
            secondDirective: function () {
                return {
                    priority: 1,
                    compile: function () {
                        compilations.push('second');
                    }
                };
            }
        });
        injector.invoke(function ($compile) {
            var el = $('<div first-directive second-directive></div>>');
            $compile(el);
            expect(compilations).toEqual(['first', 'second']);
        });
    });

    it('stops child compilation after terminal directive', function () {
        var compilations = [];
        var injector = makeInjectorWithDirectives({
            parentDirective: function () {
                return {
                    terminal: true,
                    compile: function () {
                        compilations.push('parent');
                    }
                };
            },
            childDirective: function () {
                return {
                    compile: function () {
                        compilations.push('child');
                    }
                };
            }
        });
        injector.invoke(function ($compile) {
            var el = $('<div parent-directive><div child-directive></div> </div>>');
            $compile(el);
            expect(compilations).toEqual(['parent']);
        });
    });

    it('allows applying directive to multiple elements', function () {
        var compileEl = false;
        var injector = makeInjectorWithDirectives('myDir', function () {
            return {
                multiElement: true,
                compile: function (element) {
                    compileEl = element;
                }
            };
        });
        injector.invoke(function ($compile) {
            var el = $('<div my-dir-start></div><span></span><div my-dir-end></div>');
            $compile(el);
            expect(compileEl.length).toBe(3);
        });
    });

    describe('attributes', function () {

        function registerAndCompile(dirName, domString, callback) {
            var givenAttrs;
            var injector = makeInjectorWithDirectives(dirName, function () {
                return {
                    restrict: 'EACM',
                    compile: function (element, attrs) {
                        givenAttrs = attrs;
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $(domString);
                $compile(el);
                callback(el, givenAttrs, $rootScope);
            });
        }

        it('passes the element attributes to compile function', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive my-attr="1" my-other-attr="two"></my-directive>',
                function (el, attrs) {
                    expect(attrs.myAttr).toEqual("1");
                    expect(attrs.myOtherAttr).toEqual("two");
                });
        });

        it('trims attribute values', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive my-attr="  val  "></my-directive>',
                function (el, attrs) {
                    expect(attrs.myAttr).toEqual("val");
                }
            );
        });

        it('sets the value of boolean attributes to true', function () {
            registerAndCompile(
                'myDirective',
                '<input my-directive disabled>',
                function (el, attrs) {
                    expect(attrs.disabled).toBe(true);
                }
            );
        });

        it('does not set the value of custom boolean attrbute to true', function () {
            registerAndCompile(
                'myDirective',
                '<input my-directive whatever>',
                function (el, attrs) {
                    expect(attrs.whatever).toBe('');
                }
            );
        });

        it('overrides attributes with ng-attr- version', function () {
            registerAndCompile(
                'myDirective',
                '<input my-directive ng-attr-whatever="42" whatever>',
                function (element, attrs) {
                    expect(attrs.whatever).toBe('42');
                }
            );
        });

        it('allows setting attributes', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive attr="true"></my-directive>',
                function (element, attrs) {
                    attrs.$set('attr', 'false');
                    expect(attrs.attr).toBe('false');
                }
            );
        });

        it('sets attribute to DOM', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive attr="true"></my-directive>',
                function (element, attrs) {
                    attrs.$set('attr', 'false');
                    expect(element.attr('attr')).toBe('false');
                }
            );
        });

        it('does not set attribute to DOM when flag is false', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive attr="true"></my-directive>',
                function (element, attrs) {
                    attrs.$set('attr', 'false', false);
                    expect(element.attr('attr')).toBe('true');
                }
            );
        });

        it('shares attributes between directives', function () {
            var attrs1, attrs2;
            var injector = makeInjectorWithDirectives({
                myDir: function () {
                    return {
                        compile: function (element, attrs) {
                            attrs1 = attrs;
                        }
                    };
                },
                myOtherDir: function () {
                    return {
                        compile: function (element, attrs) {
                            attrs2 = attrs;
                        }
                    };
                }
            });
            injector.invoke(function ($compile) {
                var el = $('<div my-dir my-other-dir></div>');
                $compile(el);
                expect(attrs1).toBe(attrs2);
            });
        });

        it('sets prop for boolean property', function () {
            registerAndCompile(
                'myDirective',
                '<input my-directive>',
                function (element, attrs) {
                    attrs.$set('disabled', true);
                    expect(element.prop('disabled')).toBe(true);
                }
            );
        });

        it('sets prop for boolean property even when not flushing', function () {
            registerAndCompile(
                'myDirective',
                '<input my-directive>',
                function (element, attrs) {
                    attrs.$set('disabled', true, false);
                    expect(element.prop('disabled')).toBe(true);
                }
            );
        });

        it('denormalizes attribute name when explicitly given', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive some-attribute="42"></my-directive>',
                function (element, attrs) {
                    attrs.$set('someAttribute', 43, true, 'some-attribute');
                    expect(element.attr('some-attribute')).toBe('43');
                }
            );
        });

        it('denormalizes attribute by snake-casing', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive some-attribute="42"></my-directive>',
                function (element, attrs) {
                    attrs.$set('someAttribute', 43);
                    expect(element.attr('some-attribute')).toBe('43');
                }
            );
        });

        it('denormalizes attribute by using original attribute name', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive x-some-attribute="42"></my-directive>',
                function (element, attrs) {
                    attrs.$set('someAttribute', 43);
                    expect(element.attr('x-some-attribute')).toBe('43');
                }
            );
        });

        it('does not use ng-attr- prefix in normalized names', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive ng-attr-some-attribute="42"></my-directive>',
                function (element, attrs) {
                    attrs.$set('someAttribute', 43);
                    expect(element.attr('some-attribute')).toBe('43');
                }
            );
        });

        it('uses new attribute name after once given', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive x-some-attribute="42"></my-directive>',
                function (element, attrs) {
                    attrs.$set('someAttribute', 43, true, 'some-attribute');
                    attrs.$set('someAttribute', 44);
                    expect(element.attr('some-attribute')).toBe('44');
                    expect(element.attr('x-some-attribute')).toBe('42');
                }
            );
        });

        it('calls observer immediately when attribute is $set', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive some-attribute="42"></my-directive>',
                function (element, attrs) {
                    var gotValue;
                    attrs.$observe('someAttribute', function (value) {
                        gotValue = value;
                    });

                    attrs.$set('someAttribute', '43');

                    expect(gotValue).toEqual('43');
                }
            );
        });

        it('calls observer on the next digest after registration', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive some-attribute="42"></my-directive>',
                function (element, attrs, $rootScope) {
                    var gotValue;
                    attrs.$observe('someAttribute', function (value) {
                        gotValue = value;
                    });

                    $rootScope.$digest();

                    expect(gotValue).toEqual('42');
                }
            );
        });

        it('lets observers be deregistered', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive some-attribute="42"></my-directive>',
                function (element, attrs) {
                    var gotValue;
                    var remove = attrs.$observe('someAttribute', function (value) {
                        gotValue = value;
                    });
                    attrs.$set('someAttribute', '43');
                    expect(gotValue).toEqual('43');

                    remove();

                    attrs.$set('someAttribute', '44');
                    expect(gotValue).toEqual('43');
                }
            );
        });

        it('adds an attribute from a class directive', function () {
            registerAndCompile(
                'myDirective',
                '<div class="my-directive"></div>',
                function (element, attrs) {
                    expect(attrs.hasOwnProperty('myDirective')).toBe(true);
                }
            );
        });

        it('does not add attribute from class without directive', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive class="some-class"></my-directive>',
                function (element, attrs) {
                    expect(attrs.hasOwnProperty('some-class')).toBe(false);
                }
            );
        });

        it('supports values for class directive attributes', function () {
            registerAndCompile(
                'myDirective',
                '<div class="my-directive: my attribute value"></div>',
                function (element, attrs) {
                    expect(attrs.myDirective).toBe('my attribute value');
                }
            );
        });

        it('terminates class directives attribute value at semicolon', function () {
            registerAndCompile(
                'myDirective',
                '<div class="my-directive: my attribute value; some-other-class"></div>',
                function (element, attrs) {
                    expect(attrs.myDirective).toBe('my attribute value');
                }
            );
        });

        it('adds an attribute with a value from comment directive', function () {
            registerAndCompile(
                'myDirective',
                '<!-- directive: my-directive and the attribute value -->',
                function (element, attrs) {
                    expect(attrs.hasOwnProperty('myDirective')).toBe(true);
                    expect(attrs.myDirective).toEqual('and the attribute value');
                }
            );
        });

        it('allows adding classes', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive></my-directive>',
                function (element, attrs) {
                    attrs.$addClass('some-class');
                    expect(element.hasClass('some-class')).toBe(true);
                }
            );
        });

        it('allows removing classes', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive class="some-class"></my-directive>',
                function (element, attrs) {
                    attrs.$removeClass('some-class');
                    expect(element.hasClass('some-class')).toBe(false);
                }
            );
        });

        it('allows updating classes', function () {
            registerAndCompile(
                'myDirective',
                '<my-directive class="one three four"></my-directive>',
                function (element, attrs) {
                    attrs.$updateClass('one two three', 'one three four');
                    expect(element.hasClass('one')).toBe(true);
                    expect(element.hasClass('two')).toBe(true);
                    expect(element.hasClass('three')).toBe(true);
                    expect(element.hasClass('four')).toBe(false);
                }
            );
        });
    });

    describe('linking', function () {

        it('returns a public link function from compile', function () {
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {compile: _.noop};
            });
            injector.invoke(function ($compile) {
                var el = $('<div my-directive></div>');
                var linkFn = $compile(el);
                expect(linkFn).toBeDefined();
                expect(_.isFunction(linkFn)).toBe(true);
            });
        });

        it('takes a scope and attaches it to elements', function () {
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {compile: _.noop};
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(el.data('$scope')).toBe($rootScope);
            });
        });

        it('calls directive link function with scope', function () {
            var givenScope, givenElement, givenAttrs;
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    compile: function () {
                        return function link(scope, element, attrs) {
                            givenScope = scope;
                            givenElement = element;
                            givenAttrs = attrs;
                        };
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
                expect(givenElement[0]).toBe(el[0]);
                expect(givenAttrs).toBeDefined();
                expect(givenAttrs.myDirective).toBeDefined();
            });
        });

        it('supports link function in directive definition object', function () {
            var givenScope, givenElement, givenAttrs;
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: function (scope, element, attrs) {
                        givenScope = scope;
                        givenElement = element;
                        givenAttrs = attrs;
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div my-directive></div>');
                $compile(el)($rootScope);
                expect(givenScope).toBe($rootScope);
                expect(givenElement[0]).toBe(el[0]);
                expect(givenAttrs).toBeDefined();
                expect(givenAttrs.myDirective).toBeDefined();
            });
        });

        it('links directive on child elements first', function () {
            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: function (scope, element, attrs) {
                        givenElements.push(element);
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div my-directive><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(2);
                expect(givenElements[0][0]).toBe(el[0].firstChild);
                expect(givenElements[1][0]).toBe(el[0]);
            });
        });

        it('links children when parent has no directives', function () {
            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: function (scope, element, attrs) {
                        givenElements.push(element);
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(1);
                expect(givenElements[0][0]).toBe(el[0].firstChild);
            });
        });

        it('support link function objects', function () {
            var linked;
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: {
                        post: function (scope, element, attrs) {
                            linked = true;
                        }
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(linked).toBe(true);
            });
        });

        it('supports prelinking and postlinking', function () {
            var linkings = [];
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: {
                        pre: function (scope, element) {
                            linkings.push(['pre', element[0]]);
                        },
                        post: function (scope, element) {
                            linkings.push(['post', element[0]]);
                        }
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div my-directive><div my-directive></div></div>');
                $compile(el)($rootScope);
                expect(linkings.length).toBe(4);
                expect(linkings[0]).toEqual(['pre', el[0]]);
                expect(linkings[1]).toEqual(['pre', el[0].firstChild]);
                expect(linkings[2]).toEqual(['post', el[0].firstChild]);
                expect(linkings[3]).toEqual(['post', el[0]]);
            });
        });

        it('reverses priority for post link functions', function () {
            var linkings = [];
            var injector = makeInjectorWithDirectives({
                firstDirective: function () {
                    return {
                        priority: 2,
                        link: {
                            pre: function (scope, element) {
                                linkings.push('first-pre');
                            },
                            post: function (scope, element) {
                                linkings.push('first-post');
                            }
                        }
                    };
                },
                secondDirective: function () {
                    return {
                        priority: 1,
                        link: {
                            pre: function (scope, element) {
                                linkings.push('second-pre');
                            },
                            post: function (scope, element) {
                                linkings.push('second-post');
                            }
                        }
                    };
                }
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div first-directive second-directive></div>');
                $compile(el)($rootScope);
                expect(linkings).toEqual(['first-pre', 'second-pre', 'second-post', 'first-post']);
            });
        });

        it('stabilizes node list during linking', function () {
            var givenElements = [];
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    link: function (scope, element, attrs) {
                        givenElements.push(element[0]);
                        element.after('<div></div>');
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $('<div><div my-directive></div><div my-directive></div></div>');
                var el1 = el[0].childNodes[0];
                var el2 = el[0].childNodes[1];
                $compile(el)($rootScope);
                expect(givenElements[0]).toBe(el1);
                expect(givenElements[1]).toBe(el2);
            });
        });

        it('invokes multi-element directive link functions with whole group', function () {
            var givenElements;
            var injector = makeInjectorWithDirectives('myDirective', function () {
                return {
                    multiElement: true,
                    link: function (scope, element, attrs) {
                        givenElements = element;
                    }
                };
            });
            injector.invoke(function ($compile, $rootScope) {
                var el = $(
                    '<div my-directive-start></div>' +
                    '<p></p>' +
                    '<div my-directive-end></div>'
                );
                $compile(el)($rootScope);
                expect(givenElements.length).toBe(3);
            });
        });
    });

});