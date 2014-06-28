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

var ok = function(err) { console.log(err ? 'ERR' : 'OK'); };



G('./s1.db', function(err, g) { // regular file-backed
//G(           function(err, g) { // memory-only
    if (err) { return console.error(err); }



    // PART 1 - create stuff

    if (1) {
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
                var aALikesBO = {subject:vAlbertId, predicate:'likes', object:vBethId, howMuch:1000, forHowLong:'2 years'};
                g.cA(aALikesBO, function(err, aALikesBId) {
                    if (err) { return console.error(err); }

                    // returns the arcId
                    console.log('aALikesBId:', js(aALikesBId));

                    // the arc object is changed in-place
                    console.log('aALikesBO:', js(aALikesBO));
                });
            });
        });
        return;
    }


    
    // PART 2 - query stuff

    // 1) get vertex back
    var vAlbertId = 'vtx:1';
    g.gV(vAlbertId, function(err, vAlbertO) {
        if (err) { return console.error(err); }

        console.log('vAlbertO:', js(vAlbertO));
    });



    // 2) get another vertex
    var vBethId = 'vtx:2';
    g.gV(vBethId, function(err, vBethO) {
        if (err) { return console.error(err); }

        console.log('vBethO:', js(vBethO));
    });



    // 3) get arc
    var aALikesBId = 'spo:1:likes:2';
    g.gA(aALikesBId, function(err, aALikesBO) {
    //g.gA(aALikesBId, true, function(err, aALikesBO) {
        if (err) { return console.error(err); }

        console.log('aALikesBO:', js(aALikesBO));
    });



    // 4) check all hexastore indices exist
    g.gA('spo:1:likes:2', true, ok);
    g.gA('sop:1:2:likes', true, ok);
    g.gA('pos:likes:2:1', true, ok);
    g.gA('pso:likes:1:2', true, ok);
    g.gA('osp:2:1:likes', true, ok);
    g.gA('ops:2:likes:1', true, ok);



    // 5) get arch with 0 to 2 indeterminations out of 3
    var predic = 'likes';
    var u;

    g.gAs(vAlbertId, predic, vBethId, l);

    g.gAs(u,         predic, vBethId, l);
    g.gAs(vAlbertId, u,      vBethId, l);
    g.gAs(vAlbertId, predic, u,       l);

    g.gAs(vAlbertId, u,      u,       l);
    g.gAs(u,         predic, u,       l);
    g.gAs(u,         u,      vBethId, l);

    g.gAs(u,         u,      vBethId, /*true,*/ l);
});








/*
var vBertaId = g.cV({name:'Berta'});

var aAlbertIsParentOfBertaId = g.cA({subject:,  name:'is_parent_of'}); // create arc ({aO)

g.gV(''); // get vertex ({String}vIdx | {Vertex}vO)

g.gA(''); // get arc ({String}aIdx | {Arc}aO)
*/