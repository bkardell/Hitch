Hitch
=========
A lightweight JavaScript library that provides a mechnism that allows others to easily develop and use additional extensions.

Setup (interpreted mode)
========================
Interpreted mode currently relies on JQuery 1.5 or greater.  To get started, mark a link or style tag in your page with the -hitch-interpreted attribute, include your preferred 
version of query (we recommend using one of the existing CDNs) and the interpreted version of the library.  It should look something like this:

	<link rel="stylesheet" href="styles.css" type="text/css" -hitch-interpreted="true"  />
	<script type="text/javascript" src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.1.min.js"></script>	
	<script type="text/javascript" src="hitch-interp-jquery.js"></script>
	

Setup (pre-compiled/production mode)
====================================
You can use the rulecompiler tool to create precompiled versions (very fast) for production.  The output of the tool will show you what to include.
In the end it will look something like this (note there are no dependencies in this version and the engine itself is <2k):

	<link rel="stylesheet"  href="styles-compiled.css" type="text/css" />
	<script type="text/javascript" src="hitch.js"></script>
	<script type="text/javascript" src="myHitches.js"></script>
	<script type="text/javascript" src="styles-compiled.js"></script>

Using selector hitches in your CSS
==================================
In your CSS you can reference hitches via the @-hitch-requires processing instruction, and then just use the extensions provided by that 
library in your CSS... Below is an example of a simple stylesheet that uses a -math-* library to style elements of the person class 
which contain a data-score attribute over 10000 and the highest score sibling:

	@-hitch-requires math.js

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


Using HTML hitches in your markup
====================================
In your HTML you can reference hitches via -hitch-requires to add new component capabilities... The following example shows simple inclusion of a 
hitch that provides an HTML5 canvas-based animated tag cloud (hitch developed by us based on http://www.goat1000.com/tagcanvas.php):

	<div -hitch-requires="http://69.54.28.122/tagCloud.js" -goat-tagCloud>
	     <a href="...">One</a>
	     <a href="...">Two</a>
	     <a href="...">Three</a>
	     <a href="...">Four</a>
	     <a href="...">Five</a>
	</div>

	
See the wiki for more information.
