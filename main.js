/*
 * main.js -- run this file with node
 */
var child_process = require('child_process'),
    ipschat = require('./ipschat'),
    util = require('util'),
    fs = require('fs'),
    pluginGlue = require('./plugin_glue'),
    path = require('path'),
    ips = require('./ips'),

    PLUGIN_DIR="plugins";


// Log in and load plugins
var login = JSON.parse(fs.readFileSync('./passwd').toString().trim());
console.log("* Logging in "+login.user);

// Once we start up, log in to the forum.
ips.ipsLogin('http://board.iamlights.com/', login.user, login.pass,
  function(error, ipsconnect) {
    if (error) { return console.log(error.stack); }
    console.log("* Joining chat...");
    // Once we log in, join the chat.
    ipschat.ipsChatLogin(ipsconnect, function(error, chat) {
      pluginGlue.assignChat(chat);
      if(error) { return console.log(error); }
      console.log("* Joined! Loading plugins...");
      // Once we join the chat, load plugins.
      var files = fs.readdirSync(PLUGIN_DIR);
      for (var i=0,l=files.length; i<l; i++) {
        // allow two types of plugins
        // plugin/foo.js
        // plugin/foo/foo.js
        var plugin=null;
        if (files[i].match(/\.js$/)) {
          console.log("   - " + files[i] + "...");
          plugin = require('./'+PLUGIN_DIR+'/'+path.basename(files[i],'.js'));
        } else if (
            fs.statSync('./'+PLUGIN_DIR+'/'+files[i]).isDirectory() &&
            path.existsSync(['.',PLUGIN_DIR,files[i],files[i]+'.js'].join('/'))) {
          console.log("   - " + files[i] + "...");
          plugin = require(['.',PLUGIN_DIR,files[i],files[i]].join('/'));
        }
        if (plugin !== null && typeof plugin.init == 'function') {
          plugin.init(chat);
        }
      }
      console.log("* Ready");
      // load plugins
      });
  });

