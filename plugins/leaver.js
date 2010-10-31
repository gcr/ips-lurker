/*
 * leaver.js -- when we get EOF, actually leave the chat
 */

exports.init  = function(chat) {
  process.openStdin().on('end', function() {
      chat.leave();
      console.log("Bye...");
      setTimeout(function(){process.exit(0);}, 500);
    });
};
