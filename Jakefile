var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	color = require('colors'), // provides nice CLI coloring
	rimraf = require('rimraf'), // provides recursive dir deleting
	srcFiles = [
		'./lib/engine.js', 
		'./lib/dom.js',
		'./lib/plugins.js',
		'./lib/resource.js',
		'./lib/events.js',
		'./lib/compiler.js', 
		'./adapters/hitch-adapter.js'
	],
	testFiles = [
		'./test/engine.js',
		'./test/compiler.js', 
		'./test/hitch-adapter.js'
	],
	hitchJS = 'dist/hitch-interpret.js', // final path/name of uncompressed hitch
	hitchJSmin = 'dist/hitch-interpret-min.js'; // final path/name of compressed hitch

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
	fs.writeFileSync(hitchJS, buffer.join('\n'), "utf-8");
});

desc('Lint check, compile, min, test');
task('default',['lint', 'compile', 'min', 'min-engine', 'test'],function(){
	util.log("Finished building CssPlugins!".green);
});

desc("Minification of source files");
task('min', ['compile'], function(){
	var jsp = require("uglify-js").parser,
		pro = require("uglify-js").uglify,
		orig_code = fs.readFileSync(hitchJS, "utf-8"),
		ast = jsp.parse(orig_code), // parse code and get the initial AST
		final_code; 
	
	ast = pro.ast_mangle(ast), // get a new AST with mangled names
	ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
	final_code = pro.gen_code(ast); // compressed code here
	fs.writeFile(hitchJSmin, final_code, function(err){
		if(err){ 
			util.log(err.red); 
		} else {
			util.log("Compressed ".green + hitchJSmin.green + " ...".green);
		}
	});
});

desc("Minification of engine file");
task('min-engine', ['compile'], function(){
	var jsp = require("uglify-js").parser,
		pro = require("uglify-js").uglify,
		orig_code = fs.readFileSync('./lib/engine.js', "utf-8"),
		ast = jsp.parse(orig_code), // parse code and get the initial AST
		final_code; 
	
	ast = pro.ast_mangle(ast), // get a new AST with mangled names
	ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
	final_code = pro.gen_code(ast); // compressed code here
	fs.writeFile('./dist/hitch-min.js', final_code, function(err){
		if(err){ 
			util.log(err.red); 
		} else {
			util.log("Compressed ".green + './lib/engine.js'.green + " ...".green);
		}
	});
});

desc("JSHint source");
task('lint', [], function(){

	var jshint = require('./build/jshint').JSHINT,
		found = 0, 
		w;
	
	for(var i = 0; i < srcFiles.length; i++){
		var file = srcFiles[i], src = fs.readFileSync(file, "utf8");
		util.log("JSHint checking " + file);
		jshint(src, { evil: true });
		
		for ( var x = 0; i < jshint.errors.length; i++ ) {
			w = jshint.errors[x];
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
task("test", ['lint','compile'], function(){
	var qunit = require('qunit'), 
		source, 
		test,
		context = [];
	qunit.options.assertions = false;
	for(var i = 0; i < testFiles.length; i++){
		test = testFiles[i];
		context.push({
			deps: [], 
			code: './support/libs/test-context.js', 
			tests: test
		});
	}
	qunit.run(context);
});
