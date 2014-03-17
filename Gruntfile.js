module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['lib/classlist-polyfill.js', 'lib/sizzle2.js', 'src/hitch-core.js', 'src/hitch-element.js', 'src/hitch-browser.js'],
        dest: 'dist/<%= pkg.name %>-next.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        mangle: true,
        compress: true,
        report: 'gzip'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>-next.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        ignores: ["test/lib/jquery-1.7.2.js", "test/lib/qunit.js", 'lib/classlist-polyfill.js']
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);

};