/**
 * Created by Ivan_Kauryshchanka on 10/27/2014.
 */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            sdk: {
                src: [
                    'src/ajax/jsonp.js',
                    // api
                    'src/vehicle.api.js',
                    // widget
                    'src/widget/_intro',
                    'src/widget/mixins/Observable.js',
                    'src/widget/utils.widget.js',
                    'src/widget/core.widget.js',
                    'src/widget/core.api.js',
                    'src/widget/_outro'
                ],
                dest: 'dest/widget-sdk.js'
            }
        },
        uglify: {
            sdk: {
                files: {
                    'dest/widget-sdk.min.js': 'dest/widget-sdk.js'
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
    // 3. Тут мы указываем Grunt, что хотим использовать этот плагин
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // 4. Указываем, какие задачи выполняются, когда мы вводим «grunt» в терминале
    grunt.registerTask('default', 'watch');
    grunt.registerMultiTask('build', 'Build task', function() {
        grunt.task.run(this.data);
    });

};