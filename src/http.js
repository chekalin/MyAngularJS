function $HttpProvider() {
    'use strict';

    var defaults = this.defaults = {
        headers: {
            common: {
                Accept: 'application/json, text/plain, */*'
            },
            post: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            put: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            patch: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }
    };

    function executeHeaderFns(headers, config) {
        return _.transform(headers, function (result, v, k) {
            if (_.isFunction(v)) {
                v = v(config);
                if (_.isNull(v) || _.isUndefined(v)) {
                    delete result[k];
                } else {
                    result[k] = v;
                }
            }
        }, headers);
    }

    function mergeHeaders(config) {
        var reqHeaders = _.extend(
            {},
            config.headers
        );
        var defHeaders = _.extend(
            {},
            defaults.headers.common,
            defaults.headers[(config.method || 'get').toLowerCase()]
        );
        _.forEach(defHeaders, function (value, key) {
            var headerExists = _.any(reqHeaders, function (v, k) {
                return k.toLowerCase() === key.toLowerCase();
            });
            if (!headerExists) {
                reqHeaders[key] = value;
            }
        });
        return executeHeaderFns(reqHeaders, config);
    }

    this.$get = ['$httpBackend', '$q', '$rootScope',
        function ($httpBackend, $q, $rootScope) {
            function $http(requestConfig) {
                var deferred = $q.defer();
                var config = _.extend({
                    method: 'GET',
                    transformRequest: defaults.transformRequest
                }, requestConfig);
                config.headers = mergeHeaders(requestConfig);

                if (_.isUndefined(config.withCredentials) && !_.isUndefined(defaults.withCredentials)) {
                    config.withCredentials = defaults.withCredentials;
                }

                function transformData(data, headers, transformFn) {
                    if (_.isFunction(transformFn)) {
                        return transformFn(data, headers);
                    } else {
                        return _.reduce(transformFn, function (data, fn) {
                            return fn(data, headers);
                        }, data);
                    }
                }

                function parseHeaders(headers) {
                    if (_.isObject(headers)) {
                        return _.transform(headers, function (result, v, k) {
                            result[_.trim(k.toLowerCase())] = _.trim(v);
                        }, {});
                    } else {
                        var lines = headers.split('\n');
                        return _.transform(lines, function (result, line) {
                            var separatorAt = line.indexOf(':');
                            var name = _.trim(line.substr(0, separatorAt)).toLowerCase();
                            var value = _.trim(line.substr(separatorAt + 1)).toLowerCase();
                            if (name) {
                                result[name] = value;
                            }
                        }, {});
                    }

                }

                function headersGetter(headers) {
                    var headersObj;
                    return function (name) {
                        headersObj = headersObj || parseHeaders(headers);
                        if (name) {
                            return headersObj[name.toLowerCase()];
                        } else {
                            return headersObj;
                        }
                    };
                }

                var reqData = transformData(
                    config.data,
                    headersGetter(config.headers),
                    config.transformRequest
                );

                if (_.isUndefined(reqData)) {
                    _.forEach(config.headers, function (v, k) {
                        if (k.toLowerCase() === 'content-type') {
                            delete config.headers[k];
                        }
                    });
                }

                function isSuccess(status) {
                    return status >= 200 && status < 300;
                }

                function done(status, response, headersString, statusText) {
                    status = Math.max(status, 0);
                    deferred[isSuccess(status) ? 'resolve' : 'reject']({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config: config,
                        headers: headersGetter(headersString)
                    });
                    if (!$rootScope.$$phase) {
                        $rootScope.$apply();
                    }
                }

                $httpBackend(
                    config.method,
                    config.url,
                    reqData,
                    done,
                    config.headers,
                    config.withCredentials
                );
                return deferred.promise;
            }

            $http.defaults = defaults;
            return $http;
        }];
}