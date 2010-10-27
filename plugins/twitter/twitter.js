var http=require('http'),
    fs=require('fs'),
    twitter=require('./twitter-node/lib/twitter-node/index.js');
exports.init = function(chat) {

  var login = JSON.parse(fs.readFileSync('./passwd').toString().trim());
  var twit = new twitter.TwitterNode({
    user: login.user,
    password: login.pass,
    // curl 'http://api.twitter.com/1/users/show.json?screen_name=lights'
    follow: [//15147152, // _gcr
             16143507, // lights
             50838700  // jtb
            ]
  });

  twit.on('tweet', function(tweet) {

      if (twit.following.indexOf(tweet.user.id) != -1) {
        chat.say("[b]@"+tweet.user.screen_name+": " + tweet.text + "[/b]");
        console.log("[b]@"+tweet.user.screen_name+": " + tweet.text + "[/b]");
      }

    })
    .on('end', function(resp) {
      console.log("wave goodbye... " + resp.statusCode);
      setTimeout(exports.init, 10000);
    })
    .stream();


};
