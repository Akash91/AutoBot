// LinkChecker for AutoBot
var system = require('system');
var webpage = require('webpage');
var sizearr = [[320 ,480],[768, 1024],[1280, 800],[1600, 990]];
var URL = "";
var debug = true; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links
var cleanURL;
var count = 3;
var screentimeout = 3000;

var defaulScreenShots = function() {
    takeScreenShot(sizearr[count][0], sizearr[count][1], count);
}
var takeScreenShot = function (pagewidth, pageheight, count) {
    if(typeof(count)==='undefined') {
        count = 0;
    }
    var page = webpage.create();
    page.onError = function(msg, trace) {
        if(debug && verbose) {
            var msgStack = ['ERROR: ' + msg];
            if (trace && trace.length) {
                msgStack.push('TRACE:');
                trace.forEach(function(t) {
                    msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
                });
            }
            console.error(msgStack.join('\n'));
        }
    };
    page.onLoadFinished = function(status) {
        console.log("Generating screenshot for "+pagewidth+"x"+pageheight);
        page.render(cleanURL+'/'+pagewidth+'x'+pageheight+'.png');
        if(count === 0) {
            setTimeout(function(){
                phantom.exit();
            },1000);
        }
        else {
            setTimeout(function(){
                count--;
                takeScreenShot(sizearr[count][0], sizearr[count][1], count);
                page.close();
            },screentimeout);
        }
    };
    page.viewportSize = {
        width: pagewidth,
        height: pageheight
    };
    page.open(URL, function(status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        }
    });
}

if (system.args.length === 1) {
    console.log('Pass the URL of the website as argument to this script!');
    phantom.exit(1);
} 
else {
    URL = system.args[1];
    cleanURL = URL.replace(/.*?:\/\//g, "");
    switch(system.args.length) {
        case 2:
            defaulScreenShots();
            break;
        case 3:
            var customSize = system.args[2].split('x');
            takeScreenShot(customSize[0],customSize[1]);
            break;
        default:
            phantom.exit();
        break;
    }
}
