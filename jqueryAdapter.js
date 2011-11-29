cssPlugin.useManualInit();
 $(document).ready(
	function(){ 
		var promises = [],store = window.localStorage,cv = 'plugins-cacheversion';
		$('head [data-plugins]').each(
			function(i,el){ 
				var url, cache = el.getAttribute('data-cacheversion'), 
					scripts = el.getAttribute('data-plugins').split( ',');
				for(var i=0;i<scripts.length;i++){ 
					url = scripts[i];
					if(store[cv] !== cache){ 
						store[cv] = cache;
						cache = false;
					}
					if(cache && store[url]){
						eval(store[url]);
					}else{
						promises.push($.getScript(url,function(t){
							if(store[cv]){ store[url] = t; }
						})); 
					}
				} 
			}
		); 
		$.when.apply($,promises).then(function(){
			var promises = [], cache;
			$('[data-usesplugins]').each( 
				function(i,el){ 
					var href, cache = el.getAttribute('data-cacheversion');
					if(store[cv] !== cache){ 
						store[cv] = cache;
						cache = false;
					}
					if(el.tagName === 'STYLE'){
						cssPlugin.addCompiledRules(cssPluginCompiler(el.innerHTML));
					}else{
						if(cache && store[el.href]){
							cssPlugin.addCompiledRules(JSON.parse(store[el.href]));
						}else{
							href = el.href;
							promises.push($.get(href, function(src){
								var compiled = cssPluginCompiler(src);
								if(cache){
									setTimeout(function(){
										store[href] = JSON.stringify(compiled);
									},10);
								}
								cssPlugin.addCompiledRules(compiled); 
							}, 'text'));
						}
					}
				}
			);
			$.when.apply($,promises).then(function(){
				cssPlugin.init();
			});
		});
	}
);