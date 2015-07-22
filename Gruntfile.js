module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        clean: {
            build: ['build']
        },
        jshint: {
            options: grunt.file.readJSON('.jshintrc'),
            src: ['src/**/*.js'],
            test: {
                src: ['test/**/*.js'],
                options: {
                    jasmine: true
                }
            },
            build: {
                src: ['Gruntfile.js'],
                options: {
                    node: true
                }
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