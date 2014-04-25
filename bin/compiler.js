var parse = require('css-parse');
var cssify = require('css-stringify');
var fs = require('fs');
var vm = require('vm');
var Tokenizer = require('./tokenizer.js');

var parsedCss;
var hitchAST = {
    requires: [],
    constants: [],
    rules: []
};
var generatedScript = [];
var importsBuffer = [];
var importPath;

var hashCode = function (s) {
    console.log("hashing '" + s + "'");
    return "_" + s.split("").reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
}

var beginsHashableFunction = function (tokens, token, i) {
    if (token.tokenType === ":" && tokens[i + 1].tokenType === "DELIM" && tokens[i + 1].value === "-" && tokens[i + 2].tokenType === "FUNCTION") {
        //console.log("found custom pseudo for: " + tokens[i + 2].value);
        return true;
    }
};

var watchDir = process.argv[2];
var files = fs.readdirSync(watchDir).filter(function (filename) {
    console.log(filename);
    return /.--css$/.test(filename);
});
console.log("need processing:" + files);
files.forEach(function (filename) {
    console.log("processing: " + filename )
    //TODO: shouldn't we use path.sep ?  windows?
    //TODO: Make better command line API with globbing for compiling multiple files.
    fs.readFile(watchDir + '/'  + filename, function (err, file) {
        if (err) throw err;
        parsedCss = parse(file.toString());

        //console.log(JSON.stringify(parsedCss, null, 4));
        parsedCss.stylesheet.rules.forEach(function (rule) {
            //console.log("............. " + JSON.stringify(rule));
            if (rule.type === "import") {
                importPath = rule.import.replace(/[\(|\)]/g, "").replace("custom-pseudos", "");
                //console.log("imports " + importPath);

                // This really should be the location of the file we are processing...
                var inp = fs.readFileSync(watchDir + "/" + importPath);
                importsBuffer.push(inp);

            } else if (rule.selectors) {
                var item = rule.selectors.join(","),
                    selectorBuffer = [], // the final selector(s) for this rule
                    skip = [],           // used with lookahead and args collection to avoid adding to the hashBuffer
                    parenStackDepth = 0, // to allow nested ()'s for where they might be input
                    closingParenFound = false,
                    hashBuffer = [], // holds tokens that will be hashed
                    tokens = Tokenizer.tokenize(item); 

                //console.log("---------" + item);
                // for each token in the selector
                tokens.forEach(function (token, i) {
                    //console.log("tok::: " + tokens[i].tokenType + "..... '" + tokens[i].value + "'");
                            
                    // See if it begins a customPsedoClass
                    if (beginsHashableFunction(tokens, token, i)) {
                        // If so, we'll collect the pseudo and input and hash it...
                        //hashBuffer.push(token.tokenType);
                        hashBuffer.push(tokens[i+1].value);

                        //and we need to note that each of the ones we are hashing is not part of the regular selector
                        skip.push(i);
                        skip.push(i+i);
                        
                        for (var x = i+2; !closingParenFound; x++) {
                            skip.push(x);
                            hashBuffer.push(tokens[x].value);

                            // Prevent a () inside input from being confused (no nesting of customs allowed for now)
                            if (tokens[x].tokenType === "FUNCTION") {
                                parenStackDepth++;
                                if (x === i+2) {
                                    //hashBuffer.push("("); doesn't seem to be necessary because of tab's parser
                                }
                            } else if (tokens[x].tokenType === ")") {

                                // I am a little dubious these tokens are correct?
                                parenStackDepth--;
                                if (parenStackDepth === 0) {
                                    closingParenFound = true;
                                }
                            }
                        }

                        // Hash the damn thing.
                        selectorBuffer.push("." + hashCode(hashBuffer.join("")));

                    } else if (skip.indexOf(i) === -1) {
                        
                        // If it isn't one we have hashed or doesn't need hashing, we'll just copy it...
                        // I haven't looked at all of the cases in the parser, but this looks like a pretty 
                        // good start...
                        if (token.tokenType === "HASH") {
                            selectorBuffer.push("#" + token.value);
                        } else if (/^[\[|\]|\(|\)]/.test(token.tokenType)) {
                            selectorBuffer.push(token.tokenType);
                        } else if (typeof token.value == "undefined"){

                            // Just because of how tab parses, descenant combinator is basically {}
                            selectorBuffer.push(" ");
                        } else if (token.value !== "-") {
                            // For some reason - is seen as a value in :-- style customs, we don't want to add that, just drop it
                            // anything else, we copy in...
                            selectorBuffer.push(token.value)
                        }
                    }

                });
        

               generatedScript.push(item);
                // Finally, we have the final end-state/selector
               rule.selectors = [selectorBuffer.join("")];           
            }
        });


            
        fs.writeFile(watchDir + "/" + filename.replace(".--css", ".hitched.css"), cssify(parsedCss));
        
        // TODO: Determine if Hitch.observe could be problematic here - what if I have N CSS files?
        fs.writeFile(watchDir + "/" + filename.replace(".--css", ".hitched.js"), importsBuffer.join("\n") + "\nHitch.selectors.register(" + JSON.stringify(generatedScript) + ");\nHitch.observe();");

    });
});
console.log("processed: " + files);


