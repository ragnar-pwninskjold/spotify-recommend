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

var checkComplete = function(artist) {
    complete+=1;
    console.log(complete);
    if (complete === artist.length) {
        console.log('got to right before json');
        return true;
    }
    else {
        return false;
    }
};
app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

var getTracks = function(artist) {
    //need to make parallel
    //for each related artist, take the id and make the call to spotify for top tracks
    //, then check to see if its gone through all of them (checkComplete)
    unirest.get('https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks?&country=US')
        .end(function(response) {
            artist.tracks = response.body.tracks;
            console.log(artist.tracks);
        });
};

var getRelated = function(artist) {
    unirest.get('https://api.spotify.com/v1/artists/'+artist.id+'/related-artists')
            .end(function(response) {   
                artist.related = response.body.artists;
                //res.json(artist.related);
                for (var key in artist.related) {
                    if (checkComplete(artist.related) == true) {
                        res.json(artist);
                    }
                    else {
                        getTracks(artist.related[key]);
                    }
                }
            });
};

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        getRelated(artist);
        

        //https://api.spotify.com/v1/artists/{id}/top-tracks
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