var jsdom = require('jsdom').jsdom,
	document = jsdom("<html><head></head><body>Headless testing...</body></html>"),
	window = document.createWindow();
	
module.exports.window = window;
module.exports.document = document;