
AutoBot[ ![Codeship Status for codelion/AutoBot](https://codeship.com/projects/8de6d120-4794-0132-2f6b-16fd1ca0a3af/status?branch=master)](https://codeship.com/projects/45652)
=======
This repo comprises of a set of utility scripts for testing webpages for errors.
As of now, it consists of:

* LinkChecker.js - Tests for HTTP response errors (e.g. 404), unexpected redirection and missing links.
* FormChecker.js - Tests for authentication via forms and insecure content loading with form submission.
* SpellChecker.js - Tests for spelling errors.
* ScreenChecker.js - Tests for page renderings in different viewports and compares with a sample image.

### [Dependencies]
In order to use any of the scripts you will need - [PhantomJS](http://phantomjs.org/)
Here is the download [link](http://phantomjs.org/download.html) for your specific platform. You can also install with HomeBrew using `brew install phantomjs`

### [Quick Start]
Make sure you have phantomjs installed before you try using any of the above mentioned scripts.
