var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	color = require('colors'), // provides nice CLI coloring
	rimraf = require('rimraf'), // provides recursive dir deleting
	srcFiles = [
		'./lib/cssPlugins.js', 
		'./lib/cssPluginsCompiler.js'
	],
	testFiles = [
		'./test/cssPlugins.js',
		'./test/cssPluginsCompiler.js'
	];

desc("Removes the distribution folder");
task("clean", [], function(){
	path.exists('dist', function(exists){ 
		if(exists) {
			util.log("Deleting /dist ...".red);
			rimraf('dist', function(err) { if(err) util.log(err); });
		}
	});
});

desc("Creates the distribution folder - where the compiled/tested/deployable files exist");
task("dist", [], function(){
	if(!path.existsSync('dist')){ 
		util.log("Creating /dist ...".green);
		fs.mkdirSync('dist'); 
	}
});

desc("Compiles the source files that make up the full CssPlugin lib");
task("compile", ["dist"], function(){
	util.log("Combining source files ...".green);
	var buffer = [];
	for(var i = 0; i < srcFiles.length; i++){
		buffer.push(fs.readFileSync(srcFiles[i], "utf-8"));
	}
	fs.writeFile('dist/css-plugins.js', buffer.join('\n'), function(err){
		if(err){ util.log(err.red); }
	});
});

desc('Lint check, compile, test');
task('default',['lint', 'compile', 'test'],function(){
	util.log("Finished building CssPlugins!".green);
});

desc("JSHint source");
task('lint', [], function(){

	var jshint = require('./build/jshint').JSHINT,
		found = 0, 
		w;
	
	for(var i = 0; i < srcFiles.length; i++){
		var file = srcFiles[i], src = fs.readFileSync(file, "utf8");

		jshint(src, { evil: true });
		
		for ( var i = 0; i < jshint.errors.length; i++ ) {
			w = jshint.errors[i];
			found++;
			if(w){
				util.print( "--------------------\n");
				util.print( "Problem in file " + file + " at line " + w.line + " character " + w.character + ": " + w.reason  + "\n\n");
				if(w.evidence) util.print( w.evidence.trim().red + "\n");
				util.print("--------------------\n\n");
			}
		}
		
	}
	
	if ( found > 0 ) {
		util.log( found.toString().red + " JSHint Error(s) found.".red );
	} else {
		util.log( "JSHint check passed.".green );
	}
});

desc("Run QUnit tests");
task("test", ['lint'], function(){
	var qunit = require('qunit'), 
		source, 
		test,
		context = [];
	for(var i = 0; i < srcFiles.length; i++){
		// this is junky - QUnit forces a 1-1 match on source and test
		// TODO: Look at libs like Jasmine for spec style testing
		// TODO: Maybe change QUnit to support dynamic src and test discovery
		source = srcFiles[i];
		test = testFiles[i];
		context.push({
			deps: ['./support/libs/test-context.js','./support/libs/jquery-1.7.1.js'], 
			code: source, 
			tests: test
		});
	}
	qunit.run(context);
});