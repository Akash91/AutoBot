// LinkChecker for AutoBot
var system = require('system');
var URL = "";
var arrLinks = [{link:'/',text:'__root__',parent:'__init__'}];
var visitedLinks = [];
var maxLinks = 100; // maximum number of links to be checked, exits after that
var skipExternal = false; // skip external links while checking, useful to test locally
var followall = false; // follow all links, will make you crawl outside your website
var debug = true; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links

if (system.args.length === 1) {
    console.log('Pass the URL of the website as argument to this script!');
    phantom.exit();
} 
else {
    URL = system.args[1];
    if (typeof String.prototype.endsWith !== 'function' ) {
        String.prototype.endsWith = function( str ) {
            return this.substring( this.length - str.length, this.length ) === str;
        };
    } 
    if(URL.endsWith(".html")) { //todo : replace with a regex later
        arrLinks = [{link:'',text:'__root__',parent:'__'}];
    }
    if(system.args.length > 2) {
        maxLinks = system.args[2];
    }
}
var page = require('webpage').create();
page.open(URL, function() {
    page.render(URL+'.png');
    phantom.exit();
}); 
