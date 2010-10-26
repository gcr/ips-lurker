var child_process = require('child_process'),
    ipschat = require('./ipschat'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    ips = require('./ips'),

    PLUGIN_DIR="plugins";


// Log in and load plugins
var login = JSON.parse(fs.readFileSync('./passwd').toString().trim());
console.log("* Logging in "+login.user);

ips.ipsLogin('http://board.iamlights.com/', login.user, login.pass,
  function(error, ipsconnect) {
    if (error) { return console.log(error); }
    console.log("* Joining chat...");
    ipschat.ipsChatLogin(ipsconnect, function(error, chat) {
      if(error) { return console.log(error); }
      console.log("* Joined! Loading plugins...");

      var files = fs.readdirSync(PLUGIN_DIR);
      for (var i=0,l=files.length; i<l; i++) {
        if (files[i].match(/\.js$/)) {
          console.log("   * " + files[i] + "...");
          var plugin = require('./'+PLUGIN_DIR+'/'+path.basename(files[i],'.js'));
          if (typeof plugin.init == 'function') {
            plugin.init(chat);
          } else {
            console.log("     " + files[i] + " has no exports.init() function");
          }
        }
      }
      console.log("* Ready");
      // load plugins
      });
  });

