// Karma configuration
// Generated on Fri Mar 13 2015 21:34:20 GMT+0000 (GMT)

module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['jasmine'],

        files: [
            'node_modules/lodash/index.js',
            'src/**/*.js',
            'test/**/*.spec.js'
        ],

        exclude: [],

        preprocessors: {
            'src/**/*.js': 'coverage'
        },

        reporters: ['progress', 'coverage'],

        coverageReporter: {
            dir: 'build/reports/coverage',
            reporters: [
                { type: 'text-summary'},
                { type: 'html', subdir: 'report-html' },
                { type: 'lcovonly', subdir: '.'}
            ]
        },

        browsers: ['PhantomJS']
    });
};
