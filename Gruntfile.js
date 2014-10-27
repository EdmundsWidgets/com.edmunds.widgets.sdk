/**
 * Created by Ivan_Kauryshchanka on 10/27/2014.
 */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            sdk: {
                src: [
                    'src/edmunds-sdk.js',
                    'src/ajax/jsonp.js',
                    // api
                    'src/core.api.js',
                    'src/vehicle.api.js',
                    // widget
                    'src/widget/_intro',
                    'src/widget/mixins/Observable.js',
                    'src/widget/utils.widget.js',
                    'src/widget/core.widget.js',
                    'src/widget/_outro'
                ],
                dest: 'src/edmunds-sdk.js'
            }
        },
        uglify: {
            sdk: {
                files: {
                    'src/edmunds-sdk.min.js': 'src/edmunds-sdk.js'
                }
            }
        },
        watch: {
            sdk: {
                tasks: ['build:sdk']
            }
        },
        build: {
            sdk: [
                'concat:sdk',
                'uglify:sdk'
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');


    grunt.registerTask('default', 'watch');
    grunt.registerMultiTask('build', 'Build task', function() {
        grunt.task.run(this.data);
    });

};