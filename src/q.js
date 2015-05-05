function $QProvider() {
    'use strict';

    this.$get = ['$rootScope', function ($rootScope) {
        function makePromise(value, resolved) {
            var d = new Deferred();
            if (resolved) {
                d.resolve(value);
            } else {
                d.reject(value);
            }
            return d.promise;
        }

        function handleFinallyCallback(callback, value, resolved) {
            var callbackValue = callback();
            if (callbackValue && callbackValue.then) {
                return callbackValue.then(function () {
                    return makePromise(value, resolved);
                });
            } else {
                return makePromise(value, resolved);
            }
        }

        function processQueue(state) {
            var pending = state.pending;
            delete state.pending;
            _.forEach(pending, function (handlers) {
                var deferred = handlers[0];
                var fn = handlers[state.status];
                try {
                    if (_.isFunction(fn)) {
                        deferred.resolve(fn(state.value));
                    } else if (state.status === 1) {
                        deferred.resolve(state.value);
                    } else {
                        deferred.reject(state.value);
                    }
                } catch (e) {
                    deferred.reject(e);
                }
            });
        }

        function scheduleProcessQueue(state) {
            $rootScope.$evalAsync(function () {
                processQueue(state);
            });
        }

        function Promise() {
            this.$$state = {};
            this.then = function (onFulfilled, onRejected) {
                var result = new Deferred();
                this.$$state.pending = this.$$state.pending || [];
                this.$$state.pending.push([result, onFulfilled, onRejected]);
                if (this.$$state.status > 0) {
                    scheduleProcessQueue(this.$$state);
                }
                return result.promise;
            };
            this.catch = function (onRejected) {
                return this.then(null, onRejected);
            };
            this.finally = function (callback) {
                return this.then(function (value) {
                        return handleFinallyCallback(callback, value, true);
                    }, function (rejection) {
                        return handleFinallyCallback(callback, rejection, false);
                    }
                );
            };
        }

        function Deferred() {
            this.promise = new Promise();

            this.resolve = function (value) {
                if (this.promise.$$state.status) {
                    return;
                }
                if (value && _.isFunction(value.then)) {
                    value.then(
                        _.bind(this.resolve, this),
                        _.bind(this.reject, this)
                    );
                } else {
                    this.promise.$$state.value = value;
                    this.promise.$$state.status = 1;
                    scheduleProcessQueue(this.promise.$$state);
                }
            };

            this.reject = function (v) {
                if (this.promise.$$state.status) {
                    return;
                }
                this.promise.$$state.value = v;
                this.promise.$$state.status = 2;
                scheduleProcessQueue(this.promise.$$state);
            };
        }

        function defer() {
            return new Deferred();
        }

        return {
            defer: defer
        };
    }];

}