var fs = require('fs'),
    url = require('url'),
    http = require('http'),
    cssPluginsCompiler = require('./lib/cssPluginsCompiler'), 
    src,
    compiledRulesBuff = [], 
    compiledCSSRulesFile, 
    compiledJSRulesFile,
    inPath = process.argv[2],
    reading = [],
    outPath = (process.argv.length>3) ? process.argv[3]: 'dist', 
    checker;
    
checker = function(cb){
	for(var i=0;i<reading.length;i++){
		if(!reading[i]){
			setTimeout(function(){ checker(cb); }, 100);			
			return false;
		}
	};
	cb();
};

//setup some global shit to make this work / pretend we are a browser 'just enough'   
$ = {
	getScript: function(x){
		var cssRealPath;
		if(x.indexOf('http:') === 0){
			cssRealPath = url.parse(x);
			reading.push(false);
			http.get(
				{
					host: cssRealPath.host, 
					port: 80, 
					path: cssRealPath.pathname
				},
				function(res){
					var buff = [];
					res.on('data', function(chunk){
						buff.push(chunk);
					});
					res.on('end', function(){
						eval(buff.join(''));
						reading.pop();
					});
				
				}
			);
		}else{
			cssRealPath = fs.realpathSync(process.argv[2]);
			cssRealPath = cssRealPath.substring(0,cssRealPath.lastIndexOf('/') + 1);
			eval(fs.readFileSync(cssRealPath + x, 'UTF-8'));	
		};
	}, 
	when: function(){
		return {
			then: function(next){
				checker(next);
			}
		}
	}
};

window = { location: '' };
document = { 
	head: { 'mozMatchesSelector': function(){} },
	addEventListener: function(){},
	body: { 'mozMatchesSelector': function(){} }
}; // body enough to make it work...


cssPlugins = require('./lib/cssPlugins');

console.log('reading ' + process.argv[2]);
src = fs.readFileSync(process.argv[2], 'UTF-8');

cssPluginsCompiler(src, function(o){
	for(var i=0;i<o.rules.length;i++){
		compiledRulesBuff.push(o.rules[i]);
	}
	compiledCSSRulesFile = process.argv[2].replace('.css','-compiled.css');
	compiledJSRulesFile = process.argv[2].replace('.css', '-compiled.js');
	compiledCSSRulesFile = outPath +  compiledCSSRulesFile.substring(compiledCSSRulesFile.lastIndexOf("/"));
	compiledJSRulesFile = outPath +  compiledJSRulesFile.substring(compiledJSRulesFile.lastIndexOf("/"));
	
	console.log('writing compiled css file...' + compiledCSSRulesFile);
	fs.writeFileSync(
		compiledCSSRulesFile,
		compiledRulesBuff.join("\n\n")
	);
	
	console.log('writing compiled js file...' + compiledJSRulesFile);
	fs.writeFileSync(
		compiledJSRulesFile,
		"cssPlugins.addCompiledRules({segIndex: " + JSON.stringify(o.segIndex) + "});"
	);
	
	console.log('Finished... Please be sure to include the following into your page:');
	console.log('\t<link rel="stylesheet"  href="'
		 + compiledCSSRulesFile + '" type="text/css" />');
	console.log('\t<script type="text/javascript" src="cssPlugins.js"></script>');
	for(var i=0;i<o.plugins.length;i++){
		console.log('\t<script type="text/javascript" src="' + o.plugins[i] + '"></script>');
	};
	console.log('\t<script type="text/javascript" src="' + compiledJSRulesFile + '"></script>');
},'');
	
	//fs.writeFileSync('plugin-interp-jquery.js',buff.join(";\n"));

