// lyric picker

var fs = require('fs'),
    LYRIC_FILE = "plugins/hangman/data.tex",
    RECENT_FILE = 'plugins/hangman/recent.json',
    IGNORE_RECENT = 200, // we have above 350
    recent = [];

try {
  recent = JSON.parse(fs.readFileSync(RECENT_FILE).toString().trim()).recent;
} catch(err) {
  console.log(err);
}

exports.withRandomLyric = function(chat, cb) {
  // eventually call cb with a random lyric from above
  fs.readFile(LYRIC_FILE, function(err, data) {
      if (err) {throw err;}
      var lyrics = data.toString()
                       .trim()
                       .split('\n')
                       .map(function(x){return x.trim();})
                       .filter(function(x){return (/\%/).exec(x) === null;})
                       .filter(function(x){return x.length;}),
          lyric = lyrics[Math.floor(Math.random()*lyrics.length)];
      while (recent.indexOf(lyric) !== -1 || lyric === null) {
        chat.debug("Found recent lyric: "+lyric+", trying again");
        lyric = lyrics[Math.floor(Math.random()*lyrics.length)];
      } 
      recent.push(lyric);
      while (recent.length > IGNORE_RECENT) {
        recent.shift(); // HAHA WHOOOPSIE this read 'unshift' before, can you find the bug?
      }
      // save recent
      fs.writeFile(RECENT_FILE, JSON.stringify({recent: recent}), function(err) {
          if (err) {console.log(err);}
          cb(lyric);
        });

    });
};
