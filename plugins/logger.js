/*
 * logger.js - logging to console
 */
var lockProtect = require('../lib/plugin_glue').lockProtect;

// colored output! :3
function color(col) {
  // returns a function that wraps text in a certain color
  return function(text) {
    return "\x1b["+col+"m"+text+"\x1b[0m";
  };
}

// some common colors
var black = color('1;30'),
    blue = color("1;34"),
    white = color("1;37");

// format a date with great justice
function formatDate() {
  var d = new Date();
  return black("00".substr((""+d.getHours()).length)+
          d.getHours() +
          ":" +
          "00".substr((""+d.getMinutes()).length)+
          d.getMinutes());
}

var attn = "  "+blue("-")+white("!")+blue("-")+"  "; // -!-


exports.init = function(chat) {
  chat.on('message', lockProtect(function(message, username) {
      console.log(formatDate()+"  <"+username+"> "+message);
    }));
  chat.on('system_message', lockProtect(function(msg) {
      console.log(formatDate()+attn+blue(msg));
    }));
  chat.on('user_noticed', lockProtect(function(username) {
      console.log(formatDate()+attn+blue("just noticed "+username));
    }));
  chat.on('user_enter', lockProtect(function(username) {
      console.log(formatDate()+attn+blue(username+" joined"));
    }));
  chat.on('settled', lockProtect(function() {
      console.log(formatDate()+attn+blue("Join to chat synchronized."));
    }));
  chat.on('user_exit', lockProtect(function(username) {
      console.log(formatDate()+attn+blue(username+" left"));
    }));
  chat.on('debug', lockProtect(function() {
      console.log.apply(this, [formatDate()+attn].concat(Array.prototype.slice.call(arguments))
                                                 .filter(function(x){return typeof x != 'undefined';}));
    }));
};
