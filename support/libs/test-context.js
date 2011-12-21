var jsdom = require('jsdom').jsdom,
	document = jsdom("<html><head><title>Hitch Test Fixture</title></head><body><div id='test-fixture'></div></body></html>"),
	window = document.createWindow();

var addStyleToDocument = function(str, doc){
	var head = doc.getElementsByTagName('head')[0], 
		style = doc.createElement('style');
	style.innerHTML = str;
	head.appendChild(style);
};

module.exports = {
	window: window,
	document: window.document,
	addStyleToDocument: addStyleToDocument
};