var lockProtect = require('../plugin_glue').lockProtect;
exports.init = function(chat) {
  chat.on('message', lockProtect(function(message, username) {
      console.log("<"+username+"> "+message);
    }));
  chat.on('user_enter', lockProtect(function(username) {
      console.log("*** "+username+" joined");
    }));
  chat.on('user_exit', lockProtect(function(username) {
      console.log("*** "+username+" left");
    }));
};
