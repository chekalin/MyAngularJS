module.exports = function (grunt) {

    grunt.initConfig({
        clean: {
            build: ['build']
        },
        jshint: {
            all: ['src/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: true
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
        watch: {
            all: {
                files: ['src/**/*.js', 'test/**/*.js'],
                tasks: ['jshint']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['test']);

    grunt.registerTask('test', ['clean', 'jshint', 'karma:unit']);
};