Hitch.add([	
	{
		name: '-jquery-animated',  
		filter:   function(match,argsString){
				return $(match).is(':animated');
	   }
	},{
		name: '-jquery-button',  
		base: 'button,input[type=button]'
	},
	{
		name: '-jquery-checkbox',  
		base: 'input[type=checkbox]'
	},
	{
		name: '-jquery-file',  
		base: 'input[type=file]'
	},
	{
		name: '-jquery-header',  
		base: 'h1,h2,h3,h4,h5'
	},
	{
		name: '-jquery-image',  
		base: 'input[type=image]'
	},
	{
		name: '-jquery-input',  
		base: 'input,textarea,select,button'
	},
	{
		name: '-jquery-password',  
		base: 'input[type=password]'
	},
	{
		name: '-jquery-radio',  
		base: 'input[type=radio]'
	},
	{
		name: '-jquery-reset',  
		base: 'input[type=reset]'
	},
	{
		name: '-jquery-selected',  
		base: 'option[selected]'
	},
	{
		name: '-jquery-submit',  
		base: 'button[type=submit],input[type=submit]'
	},
	{
		name: '-jquery-text',  
		base: 'input[type=text]'
	},
	,
	{
		name: '-jquery-parent',  
		base: ':not(:empty)'
	},
	{
		name: '-jquery-has', 
		base: '', 
		filter:   function(match,args){
					return match.querySelector(args) !== null;
		}
	},
	{
		name: '-jquery-eq', 
		base: '', 
		filter:   function(match,args,o){
				return match === $(o.selector).eq(args);
		}
	},
	{
		name: '-jquery-even', 
		base: '', 
		filter:   function(match,args,ctx){
				return (
					Array.prototype.splice(
						document.body.querySelectorAll(ctx.selector),0
					).indexOf(match) % 2
				) === 0;
		}
	},
	{
		name: '-jquery-odd', 
		base: '', 
		filter:   function(match,args,ctx){
				return (
					Array.prototype.splice(
						document.body.querySelectorAll(ctx.selector),0
					).indexOf(match) % 2
				) === 0;
		}
	},
	{
		name: '-jquery-first', 
		base: '', 
		filter:   function(match,args,ctx){
				return document.body.querySelector(ctx.selector) === match;
		}
	},
	{
		name: '-jquery-gt', 
		base: '', 
		filter:   function(match,args,ctx){
				var targ;
				if(args && !isNaN(args)){	
					targ = parseInt(args);
					return (
						Array.prototype.splice(
							document.body.querySelectorAll(ctx.selector),0
						).indexOf(match) > targ
					);
				};
		}
	},
	{
		name: '-jquery-lt', 
		base: '', 
		filter:   function(match,args,ctx){
				var targ;
				if(args && !isNaN(args)){	
					targ = parseInt(args);
					return (
						Array.prototype.splice(
							document.body.querySelectorAll(ctx.selector),0
						).indexOf(match) < targ
					);
				};
		}
	},
	{
		name: '-jquery-last', 
		base: '', 
		filter:   function(match,args,ctx){
				var targ = Array.prototype.splice(
					document.body.querySelectorAll(ctx.selector),0
				);
				return targ[targ.length-1] === match;
		}
	}	
]);