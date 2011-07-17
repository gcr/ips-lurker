/*jslint regexp: false*/
/*
 * balance-paren.js -- balance parenthesis
 */

var randomSay = require('../plugin_glue').randomSay;

function tryPush(stack, openers, char) {
  for (var i=0,l=openers.length; i<l; i++) {
    if (char == openers[i]) {
      stack.push(char);
    }
  }
}

function tryPop(stack, closers, char) {
  for (var i=0,l=closers.length; i<l; i++) {
    if (char == closers[i]) {
      // ensure it's the last thing on the stack
      var last = stack[stack.length-1] || "";
      last = {"<":">", "(":")", "[":"]", "{":"}", "":""}[last];
      if (char == closers[i]) {
        if (last == char) {
          stack.pop();
          return true;
        } else {
          // FLIP OUT
          return false;
        }
      }
    }
  }
  return true;
}

exports.init = function(chat) {

  chat.on('message', function(msg, username, uid) {
      if (uid == chat.userId || !chat.settled) { return; } // ignore self

      // Parse the message and ensure it has all its parens balanced.
      var stack = [];

      for (var i=0,l=msg.length; i<l; i++) {
        var char = msg[i];
        tryPush(stack, "<[({", char);
        if (!tryPop(stack, ">])}", char)) {
          //randomSay([
          //    "extra "+char+", "+username+"!",
          //    "you should really keep your parentheses balanced, "+username+"! you have an extra "+char+" in there",
          //    "don't put that "+char+" there, "+username+"! it CONFUSES me"]);
          return;
        }
      }

      var m="";
      while (stack.length) {
        m += {"<":">", "(":")", "[":"]", "{":"}", "":""}[stack.pop()];
      }
      if (m.length) {
        chat.say(m);
      }

    });
};
