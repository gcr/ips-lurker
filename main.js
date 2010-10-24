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
    ipschat.ipsLogin('http://board.iamlights.com/', user, pass, console.log);
  });


