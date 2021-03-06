var rq = require("request");
var express = require("express");
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var _ = require('underscore');
var fs = require("fs");

var mongo = require('mongodb');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

var app = express();
app.use(express.logger());

app.use("/scripts", express.static(__dirname + '/scripts'));
app.use("/images", express.static(__dirname + '/images'));

var KICKOFF_URL = "http://www.meetup.com/Santa-Barbara-JavaScript-Meetup/events/125332992/";

app.get('/', function(request, response) {
  response.sendfile("index.html");
});

app.get('/members', function(request, response) {
  // go fetch contents of Meetup event page
  rq.get(KICKOFF_URL, function(error, res, body){
    // set up html parser handler
    var handler = new htmlparser.DefaultHandler(function(error, dom){
      if (error) {
        console.log(error);
      } else {
        // grab member names from the DOM and build a list of objects
        var members = select(dom, "#rsvp-list h5.member-name a");
        var member_list = _.map(members, function(member){
          return { "name" : member.children[0].raw };
        });
        // send the member_list as JSON
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify(member_list));
        response.end();
      }
    });
    // create HTML Parser and parse the response text
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(body);
  });
});

// attempting to write some junk into a MongoDB collection
app.get('/fetch_blogs', function(request, response){

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('feedlist', function(er, collection) {
      fs.readFileSync("feedlist.txt").toString().split('\n').forEach(function(line) {
        if (line != "") {
          console.log(line);
          collection.insert({'url': line }, { }, function(er,rs) {});
        }
      });
    });
  });

  response.end();
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});