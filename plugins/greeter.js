exports.init = function(chat) {
  console.log("hello");
  chat.on('settled', function() {
      console.log("ready to greet");
      chat.on('user_enter', function(username) {
          chat.say("Hello there, "+username+"!");
        });
    });
};
