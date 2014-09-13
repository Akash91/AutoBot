// ScreenChecker for AutoBot
var system = require('system');
var webpage = require('webpage');
var sizearr = [[320 ,480],[768, 1024],[1280, 800],[1600, 990]];
var URL = "";
var debug = true; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links
var cleanURL;
var sizearrcount = 3;
var screentimeout = 3000;

function delayRender() {
    if(sizearrcount === -1) {
        // setTimeout(function(){
        phantom.exit();
        // },1000);
    }
    //setTimeout(function(){
        takeScreenshot(sizearr[sizearrcount][0], sizearr[sizearrcount][1], sizearrcount, delayRender);
        sizearrcount--;
    //},screentimeout);
}

function takeScreenshot (pagewidth, pageheight, count, callback) {

    // Count is undefined run the loop once
    if(typeof(count)==='undefined') {
        count = 0;
    }

    var page = webpage.create(); //Creating a new page object

    // To ignore js errors in page scripts
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
/*
    page.onLoadFinished = function(status) {
        console.log("Generating screenshot for "+ pagewidth + "x" + pageheight);
        page.render(cleanURL +'_' + pagewidth + 'x'+ pageheight +'.png');
        if(count === 0) {
            // setTimeout(function(){
                phantom.exit();
            // },1000);
        }
        else {
            page.close();
            callback();
        }
    };
*/
    // Set viewport size
    page.viewportSize = {
        width: pagewidth,
        height: pageheight
    };

    page.open(URL, function(status) {
        if (status !== 'success') {
            console.log('Unable to open the URL! ' + status);
            //phantom.exit();
        }
        else {
              result = page.evaluate(function () {
                                     return document.getElementsByTagName('html');
              });
              console.log("Generating screenshot for "+ pagewidth + "x" + pageheight);
              page.render(cleanURL +'_' + pagewidth + 'x'+ pageheight +'.png');
        }
        page.close();
        if (count === -1) { phantom.exit();}
        else { callback();}
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
            delayRender();
            break;
        case 3:
            var customSize = system.args[2].split('x');
            //setTimeout(function(){
                takeScreenshot(customSize[0],customSize[1],-1);
            //},screentimeout);
            break;
        default:
            phantom.exit();
        break;
    }
}
