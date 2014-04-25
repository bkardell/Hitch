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
      files: ['**/*.--js', '**/*.--css'],
      tasks: ['shell:precompile'],
      options: {
        debounceDelay: 3000
      }
    },
  
    shell: {
        precompile: {
            command: 'node ./bin/compiler.js <%=pkg["hitch-watch-dir"]%>',
            options: {
                stdout: true
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

  grunt.registerTask('precompile', ['shell:precompile']);

  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });
};