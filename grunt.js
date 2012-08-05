module.exports = function(grunt){

	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= pkg.homepage %> <%= grunt.template.today("mm/dd/yyyy hh:mm TT") %> */'
		},
		lint: {
			all: ['lib/**/*.js']
		},
		jshint: {
			options: {
				browser: true
			}
		},
		concat: {
			hitch: {
				src: ["lib/engine.js", "lib/dom.js", "lib/plugins.js", "lib/resource.js", "lib/events.js", "lib/compiler.js", "lib/adapter.js"],
				dest: "dist/<%=pkg.name%>-<%=pkg.version%>.js"
			}
		},
		min: {
			hitch: {
				src: ["<banner>", "dist/<%=pkg.name%>-<%=pkg.version%>.js"],
				dest: "dist/<%=pkg.name%>-<%=pkg.version%>.min.js"
			}
		},
		qunit: {
			all: ["http://localhost:8000/test/all.html"]
		},
		server: {
			port: 8000,
			base: "."
		}
	});

	grunt.registerTask("test", "server qunit");

};