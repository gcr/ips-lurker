/*
 * keeps track of the winner
 */
var randomSay = require('../../lib/plugin_glue').randomSay,
    fs = require('fs'),
    WINNERS_FILE='plugins/hangman/winners.json';

// for now, only track the winner a little
var champion = null,
    streak = 0,

    logData = []; // not sure what I'll do with this
                  // maybe have [ { winner: user obj,
                  //                time: time,
                  //                others: chat.users }, ... ]

try {
  var r = JSON.parse(fs.readFileSync(WINNERS_FILE).toString().trim());
  champion = r.champion||null; streak = r.streak; logData = r.logData||[];
} catch(err) {
}

function won(chat, user, nusers, sec, secPerLtr) {
  logData.push({winner: user, sec: sec, time: new Date(), secPerLtr: secPerLtr, others: chat.users});
  if (user == champion) {
    // user won!
    streak++;
    switch(streak) {
        case 2:
          randomSay([
              "that's the second time "+user+" won!",
              "looks like "+user+" won again",
              user+" won again!!",
              "of course, "+user+" takes the cake again"
            ]);
            break;
        case 3:
          randomSay([
              "YOU COULD NOT STOP "+user.toUpperCase(),
              user+" is on a roll! Three times!",
              user+" knows these lyrics really well! Three times",
              user+" has a TRIPLE COMBO",
              user+" won THREE TIMES now!",
              user.toUpperCase()+" is really good at this! Third time in a row."
            ]);
           break;
        case 4:
          randomSay([
              user+"'s four-time winning streak would make Mommy proud.",
              user.toUpperCase()+" IS UNSTOPPABLE! 4x win",
              user.toUpperCase()+" TOOK THE QUADRUPLE COMBO",
              user.toUpperCase()+" IS INSANE. 4x win!",
              user+" wins again! 4x win!",
              "YOU COULD NOT STOP "+user.toUpperCase()+"!! 4x win!",
              "As "+user+"'s jittery fingers come to a rest, everyone else stands in awe! 4x win!",
              user.toUpperCase()+" KNOWS THESE BY HEART. 4x win!",
              "I must grudgingly admit a fourth victory for "+user+" ;)"
            ]);
           break;
        case 5:
          randomSay([
              user.toUpperCase()+" IS GODLIKE! 5x win!",
              "M-M-M-M-MONSTER STREAK!EAK!eak!k! "+user.toUpperCase()+" = 5 WINS",
              user+" is LIGHTS IN DISGUISE! 5x win!",
              user+" is totally CHEATING! ;) 5x win!",
              user+" [i]insists[/i] on making a mockery of the hard work of others by winning for the fifth time !! ;)",
              user.toUpperCase()+" IS UNDEFEATED FIVE TIMES OVER.",
              user+"'s unerringly fast fingers pull through again for a fifth win",
              "Lights would be proud to see "+user+"'s fifth win!",
              user+"'s blood pressure rises as they earn their fifth win!"
            ]);
           break;
        default:
          randomSay([
              "I am confident that "+user+" is ashamded of themself after winning "+streak+" times. ;)",
              "Hang on, I need to forward this log to Lights; "+user+" has a streak of "+streak+"!",
              user+"'s sweaty palms and jittery fingers have done it again! Streak: "+streak,
              "as should come as no surprise to anyone, "+user+" won "+streak+" times",
              "it is my duty to declare another win for "+user+" ("+streak+" in a row)",
              user+" is clearly a rabid LIGHTS fan with far too much time on their hands and unerringly fast fingers. Streak: "+streak,
              user.toUpperCase()+" HAS A WINNING STREAK OF "+streak,
              user+" has a streak of "+streak+"!",
              user.toUpperCase()+" HELD THEIR STREAK OF "+streak,
              user.toUpperCase()+" IS UNDEFEATED "+streak+" TIMES OVER."
            ]);

    }
  } else {
    if (champion !== null) {
      switch(streak) {
      case 0: break; case 1: break;
          case 2:
            randomSay([
                user+" won this time!",
                user+" completely owned "+champion+"!",
                champion+" was defeated!",
                champion+" couldn't stand up to "+user+"'s leet powers",
                champion+" must be pretty angry now",
                user+" must be grinning at "+champion+"'s misfortune!",
                champion+" couldn't hold their double winning streak!"
              ]);
              break;
          case 3:
            randomSay([
                champion+" WAS DEFEATED after three wins!",
                "NEW CHAMPION: "+user+" killed "+champion+"'s triple combo!",
                champion.toUpperCase()+" FLIES AWAY IN A FIT OF RAGE!",
                "NEW HOUSE MASTER: "+user+"!",
                champion+" was DECIMATED after 3 wins!",
                champion+" got OWNED after three wins in a row!",
                champion+" got SCHOOLED. 3x streak!"
              ]);
            break;
          case 4:
            randomSay([
                "BOOOM! "+champion+"'s REIGN OF TERROR has come to an end after four wins!",
                champion+" was DETHRONED after four wins!",
                "MISSION ACCOMPLISHED. "+champion+" was ELIMINATED.",
                champion+"'s quadruple winning streak is DONE."
              ]);
            break;
          
          default:
            randomSay([
                "It's a MIRACLE! "+champion+" is NO MORE after a streak of "+streak,
                user.toUpperCase()+" ENDED "+champion.toUpperCase()+"'S "+streak+"-STREAK REIGN OF TERROR!",
                champion+" lost the streak of "+streak+"!",
                champion.toUpperCase()+" FLIES AWAY IN A FIT OF RAGE AFTER OWNING US "+streak+" TIMES!"
              ]);
      }
    }
    streak = 1;
    champion = user;
  }
  fs.writeFile(WINNERS_FILE, JSON.stringify({champion: champion, streak: streak, logData: logData}));
}

function announce(chat, nusers) {
  // announce the beginning of the chat
  chat.debug("Winners: ", champion, streak, nusers);
  if (champion !== null) {
    switch(streak) {
        case 0:
          break;
        case 1:
          if (Math.random() > 0.5) {
            randomSay([
              champion+" won last time",
              champion+" won before",
              "will "+champion+" win again?"
            ]);
          }
          break;
        case 2:
          randomSay([
              champion+" won TWICE in a row! Gang up!",
              "Someone must teach "+champion+" a lesson!",
              "you guys should beat "+champion+" this time! Won twice in a row!",
              "current two-time champ is "+champion
            ]);
          break;
        case 3:
          randomSay([
              "You all would do well to end "+champion+"'s triple streak right here",
              champion+" won three times in a row and must be stopped !!",
              "DON'T GET SCHOOLED by "+champion+" again! 3x win so far",
              "Current champion is "+champion+" who beat you THREE times in a row!",
              "Stop "+champion+"'s triple win!",
              "YOU MUST STOP "+champion.toUpperCase()+" FROM WINNING AGAIN! 3x win so far"
            ]);
          break;
        case 4:
          randomSay([
              champion+" has a QUADRUPLE COMBO",
              champion.toUpperCase()+"'S QUADRUPLE COMBO MUST BE STOPPED",
              "WARNING DANGER "+champion.toUpperCase()+" MUST BE STOPPED 4x WIN",
              "HIT "+champion.toUpperCase()+"'S WEAK POINT FOR MASSIVE DAMAGE 4x win"
            ]);
          break;
        default:
          randomSay([
              "DON'T LET "+champion.toUpperCase()+"'S STREAK OF "+streak+" DESTORY YOU AGAIN",
              champion.toUpperCase()+" IS OVER "+streak+" THOUSAND!!!!!",
              champion.toUpperCase()+" WON "+streak+" TIMES IN A ROW",
              "YOU MUST STOP "+champion.toUpperCase()+"'S STREAK OF "+streak
            ]);
    }
  }
}

exports.champion = function() { return champion; };
exports.streak = function() { return streak; };

exports.won = won;
exports.announce = announce;
