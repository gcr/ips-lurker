// lyric picker

var fs = require('fs'),
    yaml = require("yamlish"),
    LYRIC_FILE = "plugins/hangman/data.yaml",
    RECENT_FILE = 'plugins/hangman/recent.json',
    IGNORE_RECENT = 200, // we have above 350
    recent = [];

try {
  recent = JSON.parse(fs.readFileSync(RECENT_FILE).toString().trim()).recent;
} catch(err) {
  console.log(err);
}

var lyrics;
var song_to_lyric_dict;

try {
  // Preload lyrics.
  var lyricdata = (fs.readFileSync(LYRIC_FILE)
                   .toString("utf-8")
                   .trim()
                   .split('\n')
                   .map(function(x){return x.replace(/ *\#.*$/g,"");})
                   .filter(function(x){return x.trim().length;})
                   .join("\n"));
  var lyricdatadict = yaml.decode(lyricdata);
  lyrics = [];
  song_to_lyric_dict = {}; // Maps lyrics to song names

  // Add lyrics to the lyric list.
  for (var songname in lyricdatadict) {
    if (lyricdatadict.hasOwnProperty(songname)) {
      var lyriclines = (lyricdatadict[songname]
                        .split("\n")
                        .map(function(l){return l.trim();})
                        .filter(function(x){return x.length;}));
      // Add each of these lyric lines to the lyrics
      for (var i = 0,l=lyriclines.length; i<l; i++) {
	lyrics.push(lyriclines[i]);
        song_to_lyric_dict[lyriclines[i]] = songname;
      }
    }
  }
} catch(err) {
  console.log(err.stack);
}

exports.withRandomLyric = function(chat, cb) {
  // eventually call cb with a random lyric from above
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
  fs.writeFile(
    RECENT_FILE,
    JSON.stringify({recent: recent}),
    function(err) {
      if (err) {console.log(err);}
      cb(lyric);
    });

};

exports.songName = function(lyric) {
  return song_to_lyric_dict[lyric];
}

