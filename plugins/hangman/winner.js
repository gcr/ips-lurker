/*
 * keeps track of the winner
 */
var randomSay = require('../../plugin_glue').randomSay,
    fs = require('fs'),
    WINNERS_FILE='plugins/hangman/winners.json';

// for now, only track the winner a little
var champion = null,
    streak = 0;

try {
  var r = JSON.parse(fs.readFileSync(WINNERS_FILE).toString().trim());
  champion = r.champion; streak = r.streak;
} catch(err) {
}
console.log(champion, streak);


function won(chat, user, nusers) {
  if (user == champion) {
    // user won!
    streak++;
    switch(streak) {
        case 2:
          randomSay([
              "that's the second time "+user+" won!",
              "looks like "+user+" won again",
              "of coruse, "+user+" takes the cake again"
            ]);
            break;
        case 3:
          randomSay([
              "YOU COULD NOT STOP "+user.toUpperCase(),
              user+" is on a roll! Three times!",
              user+" knows these lyrics really well! Three times",
              user+" has a TRIPLE COMBO",
              user+" won THREE TIMES now!"
            ]);
           break;
        case 4:
          randomSay([
              user.toUpperCase()+" IS UNSTOPPABLE! 4x win",
              user.toUpperCase()+" TOOK THE QUADRUPLE COMBO",
              user.toUpperCase()+" IS INSANE. 4x win!",
              user+" wins again! 4x win!",
              "YOU COULD NOT STOP "+user.toUpperCase()+"!! 4x win!",
              user.toUpperCase()+" KNOWS THESE BY HEART. 4x win!"
            ]);
           break;
        case 5:
          randomSay([
              user.toUpperCase()+" IS GODLIKE! 5x win!",
              user+" is LIGHTS IN DISGUISE! 5x win!",
              user+" is CHEATING! 5x win!",
              user.toUpperCase()+" IS UNDEFEATED FIVE TIMES OVER."
            ]);
           break;
        default:
          randomSay([
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
                "NEW HOUSE MASTER: "+champion+"!",
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
  fs.writeFile(WINNERS_FILE, JSON.stringify({champion: champion, streak: streak}));
}

function announce(chat, nusers) {
  // announce the beginning of the chat
  console.log(champion, streak, nusers);
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
              champion+" won three times in a row and must be stopped !!",
              "DON'T GET SCHOOLED by "+champion+" for a fourth time!",
              "Current champion is "+champion+" who beat you THREE times in a row!",
              "Stop "+champion+"'s triple win!",
              "YOU MUST STOP "+champion.toUpperCase()+" FROM WINNING 4x!"
            ]);
          break;
        case 4:
          randomSay([
              champion+" has a QUADRUPLE COMBO",
              champion.toUpperCase()+"'S QUADRUPLE COMBO MUST BE STOPPED",
              "WARNING DANGER "+champion.toUpperCase()+" MUST BE STOPPED 4x WIN"
            ]);
          break;
        default:
          randomSay([
              "DON'T LET "+champion.toUpperCase()+"'S STREAK OF "+streak+" DESTORY YOU",
              champion.toUpperCase()+" WON "+streak+" TIMES IN A ROW",
              "YOU MUST STOP "+champion.toUpperCase()+"'S STREAK OF "+streak
            ]);
    }
  }
}

exports.won = won;
exports.announce = announce;
