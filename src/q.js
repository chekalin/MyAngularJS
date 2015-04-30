function $QProvider() {
    'use strict';

    this.$get = ['$rootScope', function ($rootScope) {
        function processQueue(state) {
            var pending = state.pending;
            delete state.pending;
            _.forEach(pending, function (handlers) {
                var fn = handlers[state.status];
                if (_.isFunction(fn)) {
                    fn(state.value);
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
                this.$$state.pending = this.$$state.pending || [];
                this.$$state.pending.push([null, onFulfilled, onRejected]);
                if (this.$$state.status > 0) {
                    scheduleProcessQueue(this.$$state);
                }
            };
            this.catch = function (onRejected) {
                this.then(null, onRejected);
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