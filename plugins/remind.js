/*
 * remind.js -- remind people of things
 */
exports.init = function(chat) {

  var target = new Date("Nov 5, 2010 12:00 CDT");

  var reminders = [
          [870, "[b]LIGHTS interview in 14 hours 30 minutes! so excited![/b]"],
          [600, "[b]LIGHTS interview in 10 hours! so excited![/b]"],
          [60, "[b]LIGHTS interview in 1 hour (I think)! http://fearlessradio.com/ [/b]"],
          [30, "[b]LIGHTS interview in half an hour! http://fearlessradio.com/ [/b]"],
          [15, "[b]15 minutes till LIGHTS' interview http://fearlessradio.com/ [/b]"],
          [5, "[b]5 minutes till LIGHTS' interview http://fearlessradio.com/ [/b]"],
          [1, "[b]power UP! power UP! LIGHTS' interview starts in a minute! http://fearlessradio.com/ [/b]"]
      ],
      timers = [];

      for (var i=0,l=reminders.length; i<l; i++) {(function(i){
          var minutes = reminders[i][0], message = reminders[i][1],
              timeout = (target - new Date())-(minutes*1000*60);
            console.log(timeout, minutes);
            if (timeout > 0) {
              setTimeout(function() {
                  chat.say(message);
                }, timeout);
            }
            console.log("next loop");
        }(i));
      }

};
