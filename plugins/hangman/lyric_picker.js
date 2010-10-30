// lyric picker

var fs = require('fs'),
    LYRIC_FILE = "plugins/hangman/data",
    IGNORE_RECENT = 100,
    recent = [];

exports.withRandomLyric = function(cb) {
  // eventually call cb with a random lyric from above
  fs.readFile(LYRIC_FILE, function(err, data) {
      if (err) {throw err;}
      var lyrics = data.toString()
                       .trim()
                       .split('\n')
                       .map(function(x){return x.trim();})
                       .filter(function(x){return x.length;}),
          lyric = lyrics[Math.ceil(Math.random()*lyrics.length)];
      if (recent.indexOf(lyric) !== -1) {
        return arguments.callee(err, data);
      } else {
        console.log(recent);
        recent.push(lyric);
        if (recent.length > IGNORE_RECENT) {
          recent.unshift();
        }
        cb(lyric);
      }
    });
};
