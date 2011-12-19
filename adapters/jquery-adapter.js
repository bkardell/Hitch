cssPlugins.useManualInit();
Hitch = { 
	ajax: { 
		load : function(url,callback,type,errCallback,allDone){
			var i, promises = [], deferred;
			for(i=0;i<url.length;i++){
				if(type==='script'){
					promises.push($.getScript(url[i]));
				}else{ 
					deferred = $.Deferred();
					$.get(url[i], function(cssText){
						cssPluginsCompiler(cssText, function(compiled){
							callback(compiled);
							deferred.resolve();
						});
					});
					promises.push(deferred);
				};
			};
			$.when.apply($,promises).then(allDone);
		}
	}
};

 $(document).ready(
	function(){ 
		var loads = [], 
			initer = function(c){
				cssPlugins.addCompiledRules(c);
			};
			
		$('[-plugins-interpret]').each( 
			function(i,el){ 
				if(el.tagName === 'STYLE'){
					cssPluginsCompiler(el.innerHTML, initer, window.location.path
					);
				}else{
					console.log(el.href);
					loads.push(el.href);
				}
			}
		);
		Hitch.ajax.load(loads,initer,'css',null,cssPlugins.init);
	}
);