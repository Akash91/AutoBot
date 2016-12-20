// FormChecker for AutoBot
var system = require('system');
var URL = ""; // can test insecure form submission with URL http://www.stealmylogin.com/demo.html
var formID = "login_form"; // for facebook.com the value is login_form
var usernameField = "username"; // for facebook.com the value is email
var username = "";
var passwordField = "password"; // for facebook.com the value is pass
var password = "";
var debug = true;   // prints state information along with details
var verbose = false; // prints all errors in loaded pages

if (system.args.length < 4) {
    console.log('Pass the URL, username and password of the form as argument to this script!');
    phantom.exit();
} else {
    URL = system.args[1];
    username = system.args[2];
    password = system.args[3];
}

function fillForm(url, page, callback, formID, usernameField, passwordField, username,
                  password) {
    //console.log('Testing URL ' + url + ' ...')

    page.onError = function (msg, trace) {
        if (debug && verbose) {
            var msgStack = ['ERROR: ' + msg];
            if (trace && trace.length) {
                msgStack.push('TRACE:');
                trace.forEach(function (t) {
                    msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
                });
            }
            console.error(msgStack.join('\n'));
        }
    };

    page.onResourceReceived = function (response) {
        if (response.stage === "start") {
            if (response.url.lastIndexOf("http://") === 0) {
                console.log("Insecure (unencrypted) content loaded at form submission with URL " + response.url);
            }
        }
    };

    page.onLoadFinished = function (status) {
        if (status === 'success') {
            if (!phantom.state) {
                if (debug) {
                    console.log('State : ' + phantom.state);
                }
                doLogin();
                phantom.state = "logged-in";
            }
            else if (phantom.state === "logged-in") {
                if (debug) {
                    console.log('State : ' + phantom.state);
                }
                callback(1, page);
            }
            else {
                if (debug) {
                    console.log('State : ' + phantom.state);
                }
                doLogin();
                callback(2, null);
            }
        }
    };


    function doLogin() {
        var fm = page.evaluate(function (formID, usernameField,
                                         passwordField, username, password) {
            if (formID !== '') {
                var frm = document.getElementById(formID);
                if (frm !== null) {
                    frm.elements[usernameField].value = username;
                    frm.elements[passwordField].value = password;
                    frm.submit();
                }
            }
            else { // no id get form by tag name and assume it is the first form to fill
                var frm = document.getElementsByTagName('form');
                if (frm !== null) {
                    frm = frm[0];
                    frm.elements[usernameField].value = username;
                    frm.elements[passwordField].value = password;
                    frm.submit();
                }
            }
            return frm;
        }, formID, usernameField, passwordField, username, password);
        if (phantom.state) {
            if (fm === '' && phantom.state === "finished") {
                console.log("Form " + formID + " submitted succesfully");
            }
            else {
                console.log("Error form " + formID + " not submitted successfully");
            }
        }
        else {
            if (fm === '') {
                console.log("Error form " + formID + " not found at the URL " + page.url);
                phantom.exit();
            }
        }
    }

    page.open(url, function (status) {
        if (status !== 'success') {
            console.log('Unable to load page with URL ' + page.url);
            phantom.exit();
        }
    });
}

function process(flag, page) {
    if (flag === 0) {
        console.log('Starting testing with URL ' + URL + ' ...');
        fillForm(URL, page, process, formID, usernameField, passwordField,
            username, password);
    }
    else if (flag === 1) {
        phantom.state = "finished";
        fillForm(URL, page, process, formID, usernameField, passwordField,
            username, password);
    }
    else {
        console.log("Testing " + URL + " completed successfully");
        phantom.exit();
    }
}

var page = require('webpage').create();
process(0, page);