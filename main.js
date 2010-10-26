var child_process = require('child_process'),
    ipschat = require('./ipschat'),
    util=require('util'),
    ips = require('./ips');

function getLoginCredentials(cb) {
  var stdin = process.openStdin(), user='';
  process.stdout.write('User> ');
  stdin.on('data', function(data) {
      child_process.exec('stty -F /dev/tty -echo');
      user=data.toString().trim();
      stdin.removeAllListeners('data');
      process.stdout.write('Pass> ');
      stdin.on('data', function(data) {
          child_process.exec('stty -F /dev/tty +echo');
          process.stdout.write('\n');
          var pass=data.toString().trim();
          stdin.removeAllListeners('data');
          cb(user, pass);
        });
    });
}

var login = JSON.parse(require('fs').readFileSync('./passwd').toString().trim());
//getLoginCredentials(function(user, pass){
    console.log("Logging in "+login.user);
    ips.ipsLogin('http://board.iamlights.com/', login.user, login.pass,
      function(error, ipsconnect) {
        if (error) { return console.log(error); }
        console.log("Joining chat...");
        ipschat.ipsChatLogin(ipsconnect, function(error, chat) {
          if(error) { return console.log(error); }
          console.log("joined!");
          chat.on('message', function(msg, username) {
              console.log("<"+username+"> " +msg);
            });
          chat.on('user_enter', function(username) {
              console.log("*** "+username+" joined");
            });
          chat.on('user_exit', function(username) {
              console.log("*** "+username+" left");
            });
          });
      });
//  });


