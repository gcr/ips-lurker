var lockProtect = require('../plugin_glue').lockProtect;

function color(col) {
  return function(text) {
    return "\x1b["+col+"m"+text+"\x1b[0m";
  };
}

var black = color('1;30'),
    blue = color("1;34"),
    white = color("1;37");

function formatDate() {
  var d = new Date();
  return black("00".substr((""+d.getHours()).length)+
          d.getHours() +
          ":" +
          "00".substr((""+d.getMinutes()).length)+
          d.getMinutes());
}

var attn = "  "+blue("-")+white("!")+blue("-")+"  ";
exports.init = function(chat) {
  chat.on('message', lockProtect(function(message, username) {
      console.log(formatDate()+"  <"+username+"> "+message);
    }));
  chat.on('system_message', lockProtect(function(msg) {
      console.log(formatDate()+attn+blue(msg));
    }));
  chat.on('user_noticed', lockProtect(function(username, uid) {
      console.log(formatDate()+attn+blue("just noticed "+username+" with uid "+uid));
    }));
  chat.on('user_enter', lockProtect(function(username, uid) {
      console.log(formatDate()+attn+blue(username+" joined with uid"+uid));
    }));
  chat.on('user_exit', lockProtect(function(username) {
      console.log(formatDate()+attn+blue(username+" left"));
    }));
};
