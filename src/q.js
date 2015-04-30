function $QProvider() {
    'use strict';

    this.$get = ['$rootScope', function ($rootScope) {
        function processQueue(state) {
            var pending = state.pending;
            delete state.pending;
            _.forEach(pending, function (onFulfilled) {
                onFulfilled(state.value);
            });
        }

        function scheduleProcessQueue(state) {
            $rootScope.$evalAsync(function () {
                processQueue(state);
            });
        }

        function Promise() {
            this.$$state = {};
            this.then = function (onFulfilled) {
                this.$$state.pending = this.$$state.pending || [];
                this.$$state.pending.push(onFulfilled);
                if (this.$$state.status > 0) {
                    scheduleProcessQueue(this.$$state);
                }
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
        }

        function defer() {
            return new Deferred();
        }

        return {
            defer: defer
        };
    }];

}