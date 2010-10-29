/* sometimes when writing plugins,
 * you need to ensure that they don't trample all over themselves.
 * for example, when you're writing a game, then when you go into 'game mode'
 * you don't want to tell jokes and confuse people.
 *
 * here's a few extra helps that will help you help your plugins help themselves
 * and keep themselves from trampling all over each other.
 */
var chat;

function ensureChat() {
  if (!chat) { throw new Error("no chat yet! call your function after it's connected."); }
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.assignChat = function(nchat) {
  chat = nchat;
};

exports.randomSay = function(sayings) {
  ensureChat();
  // will have chat automatically say things
  var saying = randomChoice(sayings);
  if (saying instanceof Array) {
    // say the sayings each a second or so apart
    (function say() {
      if (saying.length) {
        chat.say(saying.shift());
        setTimeout(say, 1500+Math.random()*2000);
      }
    })();
  } else {
    // just say it
    chat.say(saying);
  }
};

