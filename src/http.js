function $HttpProvider() {
    'use strict';

    this.$get = ['$httpBackend', '$q', '$rootScope',
        function ($httpBackend, $q, $rootScope) {
            return function $http(config) {
                var deferred = $q.defer();

                function done(status, response, statusText) {
                    deferred.resolve({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config: config
                    });
                    if (!$rootScope.$$phase) {
                        $rootScope.$apply();
                    }
                }

                $httpBackend(config.method, config.url, config.data, done);
                return deferred.promise;
            };
        }];
}