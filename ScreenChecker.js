// LinkChecker for AutoBot
var system = require('system');
var page = require('webpage').create();
var sizearr = [[1600 ,990],[1280, 800],[768, 1024],[320, 480]];
var URL = "";
var debug = true; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links
var cleanURL;
var count = 3;

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

var defaulScreenShots = function() {
    takeScreenShot(sizearr[count][0], sizearr[count][1], count);
}
var takeScreenShot = function (pagewidth, pageheight, count) {
    if(typeof(count)==='undefined') {
        count = 0;
    }
    page.viewportSize = {
        width: pagewidth,
        height: pageheight
    };
    page.open(URL, function(status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        }
        else {
            console.log(status, pagewidth, pageheight, count);
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
                },3000);
            }
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
            if( customSize[0] < 250 || customSize[1] < 250 || customSize[0] > 2048 || customSize[1] > 2048 ) {
                console.log('Pass the size as 1600x900 without whitespace');
                phantom.exit();
            }
            takeScreenShot(customSize[0],customSize[1]);
            break;
        default:
            phantom.exit();
        break;
    }
}
