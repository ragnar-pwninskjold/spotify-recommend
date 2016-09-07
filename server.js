var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var app = express();
app.use(express.static('public'));
complete = 0;

var checkComplete = function(artist, res) {
    complete+=1;
    console.log(complete);
    if (complete === artist.related.length) {
        return res.json(artist);
    }
};
app.get('/search/:name', function(req, res) {
    complete = 0;
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

globalTracks = [];

var getTracks = function(artist, i, cb) {
    //need to make parallel
    //for each related artist, take the id and make the call to spotify for top tracks
    //, then check to see if its gone through all of them (checkComplete)
    
    unirest.get('https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks?&country=US')
        .end(function(response) {
            tracks = response.body.tracks;
            //globalTracks.push(artist.tracks);
            cb(tracks, i); 
        });
};

var getRelated = function(artist) {
    unirest.get('https://api.spotify.com/v1/artists/'+artist.id+'/related-artists')
            .end(function(response) {   
                artist.related = response.body.artists;
                console.log(artist.related);
                //res.json(artist.related);
                for (var i=0; i<artist.related.length; i++) {
                    getTracks(artist.related[i], i, function(tracks, i) {
                        artist.related[i].tracks = tracks;
                        console.log(artist.related[i]);
                        checkComplete(artist, res);
                    });
                }
            });
};

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        getRelated(artist);
        //use artist ID from artist.related object
        //if request is succesful, set tracks attribute of each
        //related artist to item.tracks, where item is object
        //returned by get related artists endpoint
        //when all of the requests are complete, the entire
        //artist object should be sent to the client
    });

   

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });

    //https://api.spotify.com/v1/artists/{id}/related-artists
});





app.listen(process.env.PORT || 8080);