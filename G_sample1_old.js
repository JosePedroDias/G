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

    var part = parseInt(process.argv.slice().pop(), 10);


    // PART 0 - create stuff bulk
    if (part === 0) {
        g.cVs([
            {name:'José Pedro',      gender:'m', bornAt:'1981/01/12'},
            {name:'Margarida',       gender:'f', bornAt:'1980/11/16'},
            {name:'Maria',           gender:'f', bornAt:'2012/03/17'},
            {name:'José Augusto',    gender:'m', bornAt:'1952/03/05'},
            {name:'Maria de Lurdes', gender:'f', bornAt:'1952/03/01'},
            {name:'Vera Susana',     gender:'f', bornAt:'1975/04/11'}
        ], function(err, vIds) {
            if (err) { return console.error(err); }

            console.log('vIds:', js(vIds));
            var vZP  = vIds[0];
            var vGui = vIds[1];
            var vMi  = vIds[2];
            var vPai = vIds[3];
            var vMae = vIds[4];
            var vSu  = vIds[5];

            g.cAs([
                {subject:vZP,  predicate:'isParentOf', object:vMi, role:'father'},
                {subject:vGui, predicate:'isParentOf', object:vMi, role:'mother'},
                {subject:vPai, predicate:'isParentOf', object:vZP, role:'father'},
                {subject:vMae, predicate:'isParentOf', object:vZP, role:'mother'},
                {subject:vPai, predicate:'isParentOf', object:vSu, role:'father'},
                {subject:vMae, predicate:'isParentOf', object:vSu, role:'mother'}
            ], function(err, aIds) {
                if (err) { return console.error(err); }

                console.log('aIds:', js(aIds));

                // children of vMae
                g.sAs(vMae, 'isParentOf', undefined, true, function(err, res) {
                    if (err) { return console.error(err); }

                    console.log('children of Maria de Lurdes:');
                    res.forEach(function(aO) {
                        console.log(aO.object.name);
                    });

                    g.eA(vZP, 'isParentOf', vMi, l);
                    //g.eA(vZP, 'isParentOf', vMae, l);
                });
            });
        });
        return;
    }



    // PART 1 - create stuff
    if (part === 1) {
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



    // PART 2 - update stuff
    if (part === 2) {
        // get vertex from its id
        g.gV('vtx:1', function(err, vO) {
            if (err) { return console.error(err); }

            console.log('vAlbertO:', js(vO));

            // change properties
            vO.age = 32;

            // update vertex
            g.cV(vO, function(err) {
                if (err) { return console.error(err); }

                // modification time changed
                console.log('vAlbertO\':', js(vO));

                g.gA('spo:1:likes:2', function(err, aO) {
                    if (err) { return console.error(err); }

                    console.log('aALikesBO\':', js(aO));
                });
            });
        });
        return;
    }



    // PART 3 - traverse/filter vertices/arcs
    if (part === 3) {
        //g.gVAll(function(err, res) { // ids
        g.gVAll(true, function(err, res) { // complete objects
            console.log('all vertices:');
            console.log( js(res, 1) );
        });

        // g.gAAll(function(err, res) { // ids
        g.gAAll(true, function(err, res) { // complete objects
            console.log('all arcs:');
            console.log( js(res, 1) );
        });

        /*g.fVs(
            function(vO) { // filter function, maps vO -> Boolean
                //return true;
                return vO.age === 32;
            },
            //['vtx:1', 'vtx:2'], // optional id of vertices (all if ommitted)
            function(err, res) {
                console.log('filtered vertices:');
                console.log( js(res, 1) );
            }
        );*/

        /*g.fAs(
            function(aO) { // filter function, maps aO -> Boolean
                //return true;
                return aO.howMuch > 900;
            },
            ['spo:1:likes:2'], // optional id of arcs (all if ommitted)
            function(err, res) {
                console.log('filtered arcs:');
                console.log( js(res, 1) );
            }
        );*/
return;

        g.fAsAsync(
            function(aId, cb) { // async filter function, cb should return true to keep arc. remember arc has no vertices data
                g.gA(aId, function(err, aO) {
                    console.log(aO);
                    cb(true);
                });

                /*console.log(aO);
                setImmediate(function() {
                    // cb(true);
                    // cb(false);
                    cb(aO.howMuch > 900);
                });*/
            },
            //['spo:1:likes:2'], // optional id of arcs (all if ommitted)
            function(err, res) {
                console.log('filtered arcs:');
                console.log( js(res, 1) );
            }
        );

        return;
    }


    
    // PART 4 - query stuff
    if (part === 4) {
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

        g.sAs(vAlbertId, predic, vBethId, l);

        g.sAs(u,         predic, vBethId, l);
        g.sAs(vAlbertId, u,      vBethId, l);
        g.sAs(vAlbertId, predic, u,       l);

        g.sAs(vAlbertId, u,      u,       l);
        g.sAs(u,         predic, u,       l);
        g.sAs(u,         u,      vBethId, l);

        g.sAs(u,         u,      vBethId, /*true,*/ l);

        return;
    }



    // PART 5 - remove stuff
    if (part === 5) {
        //g.dA('spo:1:likes:2', ok);

        g.dV('vtx:1', ok); // also removes 'spo:1:likes:2'

        return;
    }
});








/*
var vBertaId = g.cV({name:'Berta'});

var aAlbertIsParentOfBertaId = g.cA({subject:,  name:'is_parent_of'}); // create arc ({aO)

g.gV(''); // get vertex ({String}vIdx | {Vertex}vO)

g.gA(''); // get arc ({String}aIdx | {Arc}aO)
*/