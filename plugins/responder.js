function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.init = function(chat) {
  chat.on('settled', function() {
      chat.on('message', function(msg, username) {

          if (msg.match(/lurker/i) && Math.random()>0.25) {
            chat.respond(randomChoice([
                  "huh?",
                  username+"?",
                  "what?",
                  "you're confusing, "+username.toLowerCase(),
                  "who? what? "+username.toLowerCase()+"?",
                  "yes, "+username.toLowerCase()+"?",
                  "lol, "+username.toLowerCase()+" is talking about me again",
                  "that's me!",
                  "over here",
                  "uh... yes?",
                  "hmm?",
                  "...",
                  "sorry, can't talk; zombies!",
                  "uh oh, you found me",
                  "OH NO! a bear behind you, "+username.toLowerCase()+"!!",
                  "i don't know, i'm just a bot",
                  "lol"
                ]));
          }

        });
    });
};
