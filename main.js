var child_process = require('child_process'),
  ipschat = require('./ipschat');

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
          cb(user, pass);
          stdin.removeAllListeners('data');
          //ips_login('http://board.iamlights.com/', user, pass);
        });
    });
}

getLoginCredentials(function(user, pass){
    console.log("Logging in...");
    ipschat.ipsLogin('http://board.iamlights.com/', user, pass,
      function(error, ipsconnect) {
        if (error) {return console.log(error);}
        console.log("Joining chat...");
        ipschat.ipsChatLogin(ipsconnect, console.log);
        });
  });


