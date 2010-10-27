exports.init = function(chat) {
  chat.on('message', function(message, username) {
      console.log("<"+username+"> "+message);
    });
  chat.on('user_enter', function(username) {
      console.log("*** "+username+" joined");
    });
  chat.on('user_exit', function(username) {
      console.log("*** "+username+" left");
    });
};
