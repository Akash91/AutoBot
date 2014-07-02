// SpellChecker for AutoBot
var system = require('system');
var bjs = require('./lib/BjSpell.js');
var URL = "";
var arrLinks = [{link:'/',text:'__root__',parent:'__init__'}];
var visitedLinks = [];
var maxLinks = 100; // maximum number of links to be checked, exits after that
var skipExternal = true; // skip external links while checking, useful to test locally
var followall = false; // follow all links, will make you crawl outside your website
var debug = true; // prints a list of all urls checked
var verbose = false; // prints detailed arrays showing visited links and queued links

if (system.args.length === 1) {
    console.log('Pass the URL of the website as argument to this script!');
    phantom.exit();
} else {
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

console.log('Starting testing with URL ' + URL + ' ...');

function getParent(url,arrLinks) {
   var parent="";
  if(verbose) {
    console.log(JSON.stringify(arrLinks));
   }
   for(var i = 0 ; i<arrLinks.length ; i++) {
      if(((URL+arrLinks[i].link) === url) || 
         ((arrLinks[i].link.lastIndexOf("http://") === 0 ||
         arrLinks[i].link.lastIndexOf("https://") === 0) && arrLinks[i].link === url)) {
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

          page.open(url,follow, function(status) {
            if(debug) {
              console.log('Testing ' + url);
           }
            if (status !== 'success' && page.url.indexOf('about:blank') !== 0 && page.url !==  url) {
              var parent = getParent(url, arrLinks);
              console.log('Unable to open (unexpected redirect) at URL ' + url + ' with parent URL '+ parent
                         + ' to URL ' + page.url);
            } else {
              var pageurl = page.url;
              var ua = page.evaluate(function(url,follow,pageurl) {
                if(!follow) return []; 
                var listofanchortags = document.getElementsByTagName('a');
                var listofparatags = document.getElementsByTagName('p');
                var ptext = '';
                var i;
                for(i=0;i<listofparatags.length;i++) {
                  ptext = ptext.concat(listofparatags[i].textContent).concat(" ");
                }
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
                  else if(element.link === "/" || element.link === "#" /*|| element.link === ""*/) {
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
                  else if (ele.link.indexOf("http://") === 0 ||
                           ele.link.indexOf("https://") === 0) {
                    return ele;
                  }
                  else if(ele.link.lastIndexOf("http://") !== 0 &&
                          ele.link.lastIndexOf("https://") !== 0) { //&&
                          //ele.link.indexOf("/") !== 0){
                        var r = /:\/\/(.[^/]+)/;
                        var startwith = "";
                      if(pageurl.lastIndexOf("https://") === 0) {
                        startwith = 'https://';
                      }
                      else {
                        startwith = 'http://';
                      }
                    if(ele.link.indexOf("/") === 0) {
                      ele.link = startwith + pageurl.match(r)[1] + '/' + ele.link.substring(1);
                    }
                    else if(ele.link.lastIndexOf("?") === 0 && pageurl.lastIndexOf("?") === -1) {
                      ele.link = pageurl + ele.link;
                    }
                    else if(ele.link === "") {
                      // empty link href
                    }
                    else {
                      //ele.link = startwith + pageurl.match(r)[1] + '/' + ele.link;
                      ele.link = pageurl.substring(0,pageurl.lastIndexOf("/")+1) + ele.link;
                    }
                  }
                  return ele;
                  });
                 return {
                    text : ptext,
                    links : filteredlinks
                 };
                 },url,follow,pageurl);
              if(verbose && debug) {
                console.log(JSON.stringify(ua));
              }
              if (visitedLinks.indexOf(url) === -1) {
                  visitedLinks.push(url);
              }
              //console.log(JSON.stringify(ua));
              var ual = ua.links;
              var words = ua.text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()"”?\]\[—]/g," ").match(/\S+/g);
              var i;
              var wrongwords = [];
              function isNumeric(obj) {
                return obj - parseFloat(obj) >= 0;
              };
              function skipWord(str) {
                return isNumeric(str) || wrongwords.indexOf(str) !== -1 ||
                       str.endsWith("ing") || str.endsWith("s") || str.endsWith("ed") 
                       || str.endsWith("’") || 
                       // hack to reduce false positives till a better dict is avail
                       str.charAt(0) === str.charAt(0).toUpperCase();   
              };
              if(words !==  null) {
                for(i=0;i<words.length;i++){
                  if(!skipWord(words[i])) {
                    if(!lang.check(words[i])) {
                      var str = lang.suggest(words[i]);
                      if(str !== '') {
                        console.log("Misspelt word : " + words[i] + " \tSuggestions : " + str);
                        wrongwords.push(words[i]);
                      }
                    }
                  }
                }
              }
              //console.log(ua.text.match(/\S+/g));
              //console.log(JSON.stringify(ual));
              ual = ual.filter(function(ele) {return arrLinks.indexOf(ele.link) === -1;});
              //console.log(JSON.stringify(ua));
              arrLinks = arrLinks.concat(ual);
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
  if(arrLinks[0].link.indexOf("http://") === 0 ||
     arrLinks[0].link.indexOf("https://") === 0){
      url = arrLinks[0].link;
    var domainOfLink = arrLinks[0].link.match(r)[1];
    var domainOfURL = URL.match(r)[1];
    //console.log(domainOfLink);
    //console.log(domainOfURL);
    if(domainOfLink === domainOfURL || followall) {
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
  else {
      maxLinks--;
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

var lang = BJSpell("en_US.js", function(){
  console.log('Dictionary loaded successfully ...');
  process(arrLinks,visitedLinks);
});