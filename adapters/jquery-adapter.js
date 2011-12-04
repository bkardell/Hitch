$(document).ready(
	function(){ 
		var promises = [];
		$('head [data-plugins]').each(
			function(i,el){ 
				var scripts = el['data-plugins'].split( ','); 
				for(var i=0;i<scripts.length;i++){ 
					promises.push($.getScript(scripts[i])); 
				} 
			}
		); 
		$('[data-usesplugins]').each( 
			function(i,el){ 
				if(el.tagName === 'STYLE'){
					cssPlugins.addCompiledRules(cssPluginsCompiler(el.innerHTML));
				}else{
					promises.push($.get(el.href, function(src){ 
						cssPlugins.addCompiledRules(cssPluginsCompiler(src)); 
					}, 'text'));
				}
			}
		); 
		$.when.apply($,promises).then(function(){
			cssPlugins.init();
		});
	}
);