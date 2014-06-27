'use strict';



var G = require('./G');



var js = function(o, indent) {
    return JSON.stringify(o, null,
        (indent ? '  ' : undefined)
    );
};

var l = function(a, b) {
    console.log(a, b);
};



G('./s1.db', function(err, g) { // regular file-backed
//G(           function(err, g) { // memory-only
    if (err) { return console.error(err); }


    if (0) {
        // 1) create vertex
        var vAlbertO = {name:'Albert'};
        g.cV(vAlbertO, function(err, vAlbertId) {
            if (err) { return console.error(err); }

            // returns the vertexId
            console.log('vAlbertId:', js(vAlbertId));

            // the vertex object is changed in-place
            console.log('vAlbertO:',  js(vAlbertO));


            // 2) create another vertex
            var vBethO = {name:'Beth'};
            g.cV(vBethO, function(err, vBethId) {
                if (err) { return console.error(err); }

                // returns the vertexId
                console.log('vBethId:', js(vBethId));

                // the vertex object is changed in-place
                console.log('vBethO:',  js(vBethO));


                // 3) create arc
                g.cA(vAlbertId, 'likes', vBethId, function(err) {
                    if (err) { return console.error(err); }

                    console.log('OK');
                });
            });
        });
        return;
    }


    



    // get vertex back
    var vAlbertId = 'vtx:1';
    g.gV(vAlbertId, function(err, vAlbertO) {
        if (err) { return console.error(err); }

        console.log('vAlbertO:', js(vAlbertO));
    });



    // get another vertex
    var vBethId = 'vtx:2';
    g.gV(vBethId, function(err, vBethO) {
        if (err) { return console.error(err); }

        console.log('vBethO:', js(vBethO));
    });



    // get arch with 0 to 2 indeterminations out of 3

    var predic = 'likes';
    var u;

    g.gAs(vAlbertId, predic, vBethId, l);

    g.gAs(u,         predic, vBethId, l);
    g.gAs(vAlbertId, u,      vBethId, l);
    g.gAs(vAlbertId, predic, u,       l);

    g.gAs(vAlbertId, u,      u,       l);
    g.gAs(u,         predic, u,       l);
    g.gAs(u,         u,      vBethId, l);



    /*g.gA('sop:1:2:likes', true, function(err, aO) {
        if (err) { return console.error(err); }

        console.log('arc:' + js(aO, 1));
    });*/



    g.gA('spo:1:likes:2', true, l);
    g.gA('sop:1:2:likes', true, l);
    g.gA('pos:likes:1:2', true, l);
    g.gA('pso:likes:2:1', true, l);
    g.gA('osp:2:1:likes', true, l);
    g.gA('ops:2:likes:1', true, l);
});








/*
var vBertaId = g.cV({name:'Berta'});

var aAlbertIsParentOfBertaId = g.cA({subject:,  name:'is_parent_of'}); // create arc ({aO)

g.gV(''); // get vertex ({String}vIdx | {Vertex}vO)

g.gA(''); // get arc ({String}aIdx | {Arc}aO)
*/