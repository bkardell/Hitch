var plugins = [
		
	{
		name: 'div-base',
		base: 'div',
		fn: function(match, args) { return true; }
	},
	
	{
		name: 'false-return',
		base: '',
		fn: function(match, args) { 
			// do something globally to test execution
			window['false-return'] = true; 
			return false; 
		}
	}
	
];

module.exports = plugins;