var fs = require('fs'),
    cssPluginsCompiler = require('./cssPluginsCompiler'), 
    src,
    compiledRulesBuff = [];
    
//setup some global shit to make this work / pretend we are a browser 'just enough'   
$ = {
	getScript: function(x){
		eval(fs.readFileSync(x, 'UTF-8'));	
	}, 
	when: function(){
		return {
			then: function(t){
				t();
			}
		}
	}
};

document = { 
	head: { 'mozMatchesSelector': function(){} },
	addEventListener: function(){},
	body: { 'mozMatchesSelector': function(){} }
}; // body enough to make it work...


cssPlugins = require('./cssPlugins');

console.log('reading ' + process.argv[2]);
src = fs.readFileSync(process.argv[2], 'UTF-8');

cssPluginsCompiler(src, function(o){
	for(var i=0;i<o.rules.length;i++){
		compiledRulesBuff.push(o.rules[i]);
	}
	console.log('writing compiled css file...' + process.argv[2].replace('.css','-compiled.css'));
	fs.writeFileSync(
		process.argv[2].replace('.css','-compiled.css'),
		compiledRulesBuff.join("\n\n")
	);
	
	console.log('writing compiled js file...' + process.argv[2].replace('.css','-compiled.js'));
	fs.writeFileSync(
		process.argv[2].replace('.css','-compiled.js'),
		"cssPlugins.addCompiledRules({segIndex: " + JSON.stringify(o.segIndex) + "});"
	);
});
	
	//fs.writeFileSync('plugin-interp-jquery.js',buff.join(";\n"));

