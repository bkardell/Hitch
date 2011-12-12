CSS Plugins
=========
A JavaScript library that provides CSS extensions with the -plugin-* vendor prefix and framework that allows others to easily develop and use additional extensions.

Setup (interpreted mode)
========================
Interpreted mode currently relies on JQuery 1.5 or greater.  To get started, mark a link or style tag in your page with the -plugins-interpret attribute, include your preferred 
version of query (we recommend using one of the existing CDNs) and the interpreted version of the library.  It should look something like this:

	<link rel="stylesheet" 
		href="styles.css" type="text/css" -plugins-interpret="true"  />

	<script type="text/javascript" src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.1.min.js"></script>
	
	<script type="text/javascript" src="plugin-interp-jquery.js"></script>
	

Setup (pre-compiled/production mode)
====================================
You can use the rulecompiler tool to create precompiled versions (very fast) for production.  The output of the tool will show you what to include.
In the end it will look something like this (note there are no dependencies in this version and the engine itself is <2k):

	<link rel="stylesheet"  href="styles-compiled.css" type="text/css" />
	<script type="text/javascript" src="cssPlugins.js"></script>
	<script type="text/javascript" src="myPlugins.js"></script>
	<script type="text/javascript" src="styles-compiled.js"></script>

Usage (In your CSS)
===================
In your CSS you can reference plugins via the @-plugins-require processing instruction, and then just use the extensions provided by that 
library in your CSS... Below is an example of a simple stylesheet that uses a -math-* library to style elements of the person class 
which contain a data-score attribute over 10000 and the highest score sibling:

	@-plugins-require math.js

	.person{
		padding: 1em;
		border:  2px solid #F6EDA9;
	}

	.person:-math-greaterthan(data-score,10000){  
		border-color: blue;
	}

	.person:-math-greatest(data-score){
		background-color: blue;
		color: white;
	}




	
Description
===========
Currently, the CSS specification allows for [vendor prefixed](http://www.w3.org/TR/CSS2/syndata.html#vendor-keywords) extensions
to CSS. As well it provides the capability to extend Selectors with [pseudo-classes](http://www.w3.org/TR/CSS2/selector.html#pseudo-class-selectors).  

Most pseudo-classes are created by browser manufacturers to provide early implementations of features hoping to get added to the next CSS Selectors draft. If people like it, or if the rationale is strong enough, other browsers follow suit, each offering their own [vendor prefixed version](http://www.w3.org/TR/CSS21/syndata.html#vendor-keyword-history).

During this time, the extension is arguably "unstable" or subject to change by the browser implementor. As such users are warned against using these extensions. However, the community generally reaches consensus on the feature quickly. At this point it is possible to draft the extension into the standard where it can be finalized by committee, but not without the possibility of change and/or rejection.

### Advantages of the current system
* It prevents the kinds of browser wars which can create long term instability.
* Ensures a comparatively small, universal set which works everywhere.
* The initial implementor or two provide a great opt-in mechanism for CSS mavens to try it out, comment on it, blog about it, etc.

### Disadvantages of the current system
* Initial implementations are generally impractical for real world use, so the testing is artificially limited to non-real world use cases.
* A single invalid selector negates the entire rule. The entire rule must be repeated with each of the vendor prefixes.
* The W3C and browser manufacturers are constrained with the force of "don't break the web".

CSS Plugins solves the problems and disadvantages of the current system by providing developers the ability to supply their own CSS extensions. By adhering to the standard vendor prefixing and pseudo-class implementations of CSS, CSS Plugins provides a JavaScript emulation of what CSS would do natively with the extensions. By putting the power into the hands of the developers, CSS Plugins makes CSS far more extensible right now - as opposed to the the time it would take browsers implementors and standards writers to agree.

How does all of it work together?
============================================

An extension for CSS Plugins has the following form:

	var belowPlugin = {
		// the name of the pseudo-class  
		name: 'myplugin-below', 
		// A Selector to determine when to use plugin
		base: '[below]',
		// the function executed when the Selector matches 
		fn:   function(match, argsString){
			// grab the 'below' attribute from the DOM element
			var value = match.getAttribute('below');
			// argsString is the value supplied in the CSS pseduo-class
			return value < argsString;
		}
	};
	
The plugin above can be added to the CSS Plugins this way:

	cssPlugins.addFilters([belowPlugin]);
	
A CSS rule written with the plugin:

	div:myplugin-below(100) {
		color: red;
	}

HTML that would receive the properties of the rule above:

	<div below=50>This is below 100</div>

HTML that would NOT receive the properties of the rule above:

	<div below=101>This is above 100</div>