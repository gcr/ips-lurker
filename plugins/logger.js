var lockProtect = require('../plugin_glue').lockProtect;

function formatDate() {
  var d = new Date();
  return ("00".substr((""+d.getHours()).length)+
          d.getHours() +
          ":" +
          "00".substr((""+d.getMinutes()).length)+
          d.getMinutes());
}

exports.init = function(chat) {
  chat.on('message', lockProtect(function(message, username) {
      console.log(formatDate()+"  <"+username+"> "+message);
    }));
  chat.on('user_noticed', lockProtect(function(username, uid) {
      console.log(formatDate()+"  *** just noticed "+username+" with uid "+uid);
    }));
  chat.on('user_enter', lockProtect(function(username, uid) {
      console.log(formatDate()+"  *** "+username+" joined with uid"+uid);
    }));
  chat.on('user_exit', lockProtect(function(username) {
      console.log(formatDate()+"  *** "+username+" left");
    }));
};
