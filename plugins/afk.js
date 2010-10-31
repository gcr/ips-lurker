/*
 * afk.js -- testing afk functionality
 *
 * say 'afk?' in the chat and i'll tell you when people said something last
 */

exports.init = function(chat) {
  chat.on('message', function(msg, user, uid) {
      if (!chat.settled || uid == chat.userId) { return; }

      var result = [];
      for (var usr in chat.users) {
        if (chat.users.hasOwnProperty(usr)) {
          result.push(usr+" said something "+
              Math.round((new Date() - chat.users[usr].lastActivity)/1000) + " sec ago");
        }
      }

      if (msg.match(/afk\?/)) {
        chat.say(result.join(", &nbsp; &nbsp;"));
      }
    });
};
