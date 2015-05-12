function $HttpProvider() {
    'use strict';

    var defaults = {
        headers: {
            common: {
                Accept: 'application/json, text/plain, */*'
            }
        }
    };

    function mergeHeaders(config) {
        return _.extend(
            {},
            defaults.headers.common,
            config.headers
        );
    }

    this.$get = ['$httpBackend', '$q', '$rootScope',
        function ($httpBackend, $q, $rootScope) {
            return function $http(requestConfig) {
                var deferred = $q.defer();
                var config = _.extend({
                    method: 'GET'
                }, requestConfig);
                config.headers = mergeHeaders(requestConfig);

                function isSuccess(status) {
                    return status >= 200 && status < 300;
                }

                function done(status, response, statusText) {
                    status = Math.max(status, 0);
                    deferred[isSuccess(status) ? 'resolve' : 'reject']({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config: config
                    });
                    if (!$rootScope.$$phase) {
                        $rootScope.$apply();
                    }
                }

                $httpBackend(
                    config.method,
                    config.url,
                    config.data,
                    done,
                    config.headers
                );
                return deferred.promise;
            };
        }];
}