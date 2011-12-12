desc('Interpreted With JQuery Adapter... Load/compile on the fly (localStorage cache possible) via simple meta-data');
task('default',[],function(){
	var fs = require('fs'),
		files = [
			'.\/lib\/cssPlugins.js',
			'.\/lib\/cssPluginsCompiler.js',
			'.\/adapters\/jquery-adapter.js'
		], 
		buff = [];
	for(var i=0;i<files.length;i++){
		buff.push(fs.readFileSync(files[i]));
	}
	
	fs.writeFileSync('dist\/plugin-interp-jquery.js',buff.join(";\n"));
});

/*
desc('Interpreted Without JQuery Adapter...Load/compile on the fly - it is up to you to feed the compiler and load plugins');
task('interpreted',[],function(){
	var fs = require('fs'),
		files = [
			'.\/lib\/cssPlugins.js',
			'.\/lib\/cssPluginsCompiler.js'
		], 
		buff = [];
	for(var i=0;i<files.length;i++){
		buff.push(fs.readFileSync(files[i]));
	}
	
	fs.writeFileSync('plugin-interp.js',buff.join(";\n"));
});

desc('Precompiled With JQuery Adapter...Run precompiled rules (localStorage cache possible) via simple meta-data');
task('precompiled-jquery',[],function(){
	var fs = require('fs'),
		files = [
			'.\/lib\/cssPlugins.js',
			'.\/lib\/cssPluginsCompiler.js',
			'.\/adapters\/jquery-adapter.js'
		], 
		buff = [];
	for(var i=0;i<files.length;i++){
		buff.push(fs.readFileSync(files[i]));
	}
	
	fs.writeFileSync('plugin-jquery.js',buff.join(";\n"));
});


desc('Precompiled...Run precompiled rules - it is up to you to feed it. Smallest/fastest.');
task('precompiled',[],function(){
	var fs = require('fs'),
		files = [
			'.\/lib\/cssPlugins.js'
		], 
		buff = [];
	for(var i=0;i<files.length;i++){
		buff.push(fs.readFileSync(files[i]));
	}
	
	fs.writeFileSync('plugin.js',buff.join(";\n"));
});
*/