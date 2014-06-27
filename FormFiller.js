// FormFiller for AutoBot
var system = require('system');
var URL = "https://www.facebook.com";
var formID = "login_form";
var usernameField = "email";
var username = "sandeep85.das@gmail.com";
var passwordField = "pass";
var password = "iamanidiot";
var debug = true;
var verbose = true;

function fillForm(url, callback, formID, usernameField, passwordField, username,
	password) {
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
	
	page.onLoadFinished = function(status) {
          if(status === 'success') {
            if(!phantom.state) {
              console.log('State : ' + phantom.state);
              doLogin();
              phantom.state = "logged-in";
            }
            else if(phantom.state === "logged-in") {
              console.log('State : ' + phantom.state);
              callback(0,page);
            }
            else {
              callback(1,null);
            }
          }		
	};
        
	
	function doLogin() {
          page.evaluate(function (formID, usernameField, 
                  passwordField, username, password) {
            var frm = document.getElementById(formID);
            frm.elements[usernameField].value = username;
            frm.elements[passwordField].value = password;
            frm.submit();
          }, formID, usernameField, passwordField, username, password);	
	}
			
	page.open(url);
}

function process (flag, page) {
	if(flag === 0) {
          if(page === null) {
            console.log('Starting testing with URL ' + URL + ' ...');
            fillForm(URL, process, formID, usernameField, passwordField, 
                    username, password);
          }
          else {
            page.open(URL+"/messages");
            page.render('test.png');
            phantom.state = "screenshot";
          }
	}
	else if (flag === 1) {
          console.log("Testing " + URL + "completed successfully");
          phantom.exit();
	}
}

process(0,null);