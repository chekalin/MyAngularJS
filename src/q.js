function $QProvider() {
    'use strict';

    this.$get = ['$rootScope', function ($rootScope) {
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
                return this.then(function () {
                        callback();
                    }, function () {
                        callback();
                    }
                );
            };
        }

        function Deferred() {
            this.promise = new Promise();

            this.resolve = function (v) {
                if (this.promise.$$state.status) {
                    return;
                }
                this.promise.$$state.value = v;
                this.promise.$$state.status = 1;
                scheduleProcessQueue(this.promise.$$state);
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