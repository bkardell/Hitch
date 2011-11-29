desc('the whole enchillada...');
task('default',[],function(){
	var fs = require('fs'),
		files = [
			'cssPlugin2.js',
			'cssPluginCompiler.js',
			'jqueryAdapter.js'
		], 
		buff = [];
	for(var i=0;i<files.length;i++){
		buff.push(fs.readFileSync(files[i]));
	}
	
	fs.writeFileSync('cssPlugin-all.js',buff.join(";\n"));
});