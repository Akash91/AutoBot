// LinkChecker for AutoBot
var system = require('system');
var URL = "";
var arrLinks = [{link:'/',text:'__root__',parent:'__'}];
var visitedLinks = [];
var maxLinks = 100; // maximum number of links to be checked, exits after that
var skipExternal = false; // skip external links while checking, useful to test locally
var followall = false; // follow all links, will make you crawl outside your website
var debug = false; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links

if (system.args.length === 1) {
    console.log('Pass the URL of the website as argument to this script!');
    phantom.exit();
} else {
    URL = system.args[1];
   if (typeof String.prototype.endsWith != 'function' ) {
      String.prototype.endsWith = function( str ) {
      return this.substring( this.length - str.length, this.length ) === str;
      }
   } 
  if(URL.endsWith(".html")) { //todo : replace with a regex later
    arrLinks = [{link:'',text:'__root__',parent:'__'}];
   }
   if(system.args.length > 2) {
     maxLinks = system.args[2];
   }
}

console.log('Starting testing with URL ' + URL + ' ...')

function getParent(url,arrLinks) {
   var parent="";
  if(verbose) {
    console.log(JSON.stringify(arrLinks));
   }
   for(var i = 0 ; i<arrLinks.length ; i++) {
      if(((URL+arrLinks[i].link) == url) || 
         ((arrLinks[i].link.lastIndexOf("http:") === 0 ||
         arrLinks[i].link.lastIndexOf("https:") === 0) && arrLinks[i].link == url)) {
         parent = arrLinks[i].parent;
         break;
        }
    } 
  return parent;
}

function startChecking(url,callback,arrLinks,visitedLinks,follow) {
var page = require('webpage').create();
  //console.log('Testing URL ' + url + ' ...')
  
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
  
  page.onResourceReceived = function(response) {
    // check for a resource only once, since it may be split in response
          if(response.stage == "start") {
            if(follow || url == response.url) {
              if(response.status >= 400 && response.status < 500) {
                var parent = getParent(url,arrLinks);
                //console.log(response.stage);
                console.log('HTTP Client Error # ' + response.status + ' while testing resource ' + response.url
                           + ' at URL ' + url + ' with parent URL ' + parent);
              }
              if(response.status >= 500 && response.status < 600) {
                var parent = getParent(url,arrLinks);
                console.log('HTTP Server Error # ' + response.status + ' while testing resource ' + response.url
                            + ' at URL ' + url + ' with parent URL ' + parent);
              }
            }
          }
          };

          page.open(url,follow, function(status) {
            if(debug) {
              console.log('Testing ' + url);
           }
            if (status !== 'success' && page.url.indexOf('about:blank') !== 0) {
              var parent = getParent(url, arrLinks);
              console.log('Unable to open (unexpected redirect) at URL ' + url + ' with parent URL '+ parent
                         + ' to URL ' + page.url);
            } else {
              var pageurl = page.url;
              var ua = page.evaluate(function(url,follow,pageurl) {
                if(!follow) return []; 
                var listofanchortags = document.getElementsByTagName('a');
                var links = Array.prototype.map.call(listofanchortags,function(link){
                    return {
                      link : link.getAttribute('href'),
                      text : link.textContent,
                      parent : url
                    };
                  });
                var filteredlinks = links.filter(function(element){
                  var flag = true;
                  if(element.link === null) {
                    flag = false;
                  }
                  else if(element.link == "/" || element.link == "#" /*|| element.link === ""*/) {
                    flag = false; // filter links to same page
                  }
                  else if(//element.link.lastIndexOf("http:") === 0
                          //|| element.link.lastIndexOf("https:") === 0
                          element.link.lastIndexOf("mailto:") === 0 
                          || element.link.lastIndexOf("tel:") === 0
                          || element.link.lastIndexOf("javascript:") === 0
                          || element.link.lastIndexOf("//") === 0 
                          || element.link.lastIndexOf("#") === 0
                          //|| element.link.endsWith(".pdf")
                          //|| element.link.endsWith(".ppt")
                          //|| element.link.endsWith(".pptx")
                          //|| element.link.endsWith(".ps") 
                          ) { 
                    flag = false; // filter external links
                  }
                  return flag;
                });
                filteredlinks = Array.prototype.map.call(filteredlinks,function(ele){
                  if(ele.link.lastIndexOf("..") === 0) {
                    ele.link = "/"+ele.link;
                  }
                  else if(ele.link.lastIndexOf("http:") !== 0 &&
                          ele.link.lastIndexOf("https:") !== 0) { //&&
                          //ele.link.indexOf("/") !== 0){
                       if(ele.text.trim() !== "" && ele.link === "") {
                            ele.text = "__missing__link__"+ele.text.trim();
                            ele.link = "__missing__link__";
                            return ele;
                         }
                        var r = /:\/\/(.[^/]+)/;
                        var startwith = "";
                      if(pageurl.lastIndexOf("https:") === 0) {
                        startwith = 'https://';
                      }
                      else {
                        startwith = 'http://';
                      }
                    if(ele.link.indexOf("/") === 0) {
                      ele.link = startwith + pageurl.match(r)[1] + '/' + ele.link.substring(1);
                    }
                    else {
                      ele.link = startwith + pageurl.match(r)[1] + '/' + ele.link;
                    }
                  }
                  return ele;
                  });
                return filteredlinks;
                 },url,follow,pageurl);
              if(verbose && debug) {
                console.log(JSON.stringify(ua));
              }
              if (visitedLinks.indexOf(url) === -1) {
                  visitedLinks.push(url);
              }
              ua = ua.filter(function(ele) {return arrLinks.indexOf(ele.link) === -1;});
              //console.log(JSON.stringify(ua));
              arrLinks = arrLinks.concat(ua);
              //console.log(JSON.stringify(arrLinks));
              arrLinks = arrLinks.filter(function(ele) { 
                  return visitedLinks.indexOf(URL+ele.link) === -1
                   && visitedLinks.indexOf(ele.link) === -1;
              });
              //console.log(JSON.stringify(arrLinks));
            }
         page.close();
         arrLinks.splice(0,1);   
         callback(arrLinks,visitedLinks);
    });
}

function process(arrLinks, visitedLinks) {
  if(verbose && !debug) {
    console.log('Visited - '+visitedLinks);
    var workList = Array.prototype.map.call(arrLinks,function(ele){return ele.link;});
    console.log('In queqe - '+ workList);
  }
  var url = "";
  var follow = true;
  var r = /:\/\/(.[^/]+)/;
if(arrLinks.length > 0 && maxLinks > 0) {
  if(arrLinks[0].link.lastIndexOf("http:") === 0 ||
     arrLinks[0].link.lastIndexOf("https:") === 0){
      url = arrLinks[0].link;
    var domainOfLink = arrLinks[0].link.match(r)[1];
    var domainOfURL = URL.match(r)[1];
    //console.log(domainOfLink);
    //console.log(domainOfURL);
    if(domainOfLink == domainOfURL || followall) {
      follow = true;
    }
    else {
      follow = false;
    }
   }
   else{
     url = URL+(arrLinks[0].link);
    }
  //console.log(skipExternal);
  //console.log(follow);
  if(skipExternal && !follow) {
       arrLinks.splice(0,1);
       if (visitedLinks.indexOf(url) === -1) {
         visitedLinks.push(url);
       }
       process(arrLinks, visitedLinks);
     }
  else if(arrLinks[0].text.lastIndexOf("__missing__link__") === 0) {
      console.log('Missing link found at URL ' + arrLinks[0].parent+ ' with text ' 
                  + arrLinks[0].text.substring(17));
      arrLinks.splice(0,1);            
      process(arrLinks, visitedLinks);            
     }
     else {
      maxLinks--;
      //arrLinks.splice(0,1);
      startChecking(url,process,arrLinks,visitedLinks,follow);
     }
}
else {
  if(maxLinks > 0) {
    console.log('Testing ' + URL + ' completed successfully');
  }
  else {
    console.log('Testing ' + URL + ' terminated as maxLinks bound reached');
  }
    phantom.exit();
}
}

process(arrLinks,visitedLinks);
