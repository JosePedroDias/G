'use strict';

/*jshint esnext:true*/

/**
 * either use node 0.11.x with the --harmony-generators
 * or install and call gnode instead (https://github.com/TooTallNate/gnode), which uses facebook regenerator (https://github.com/facebook/regenerator)
 */



var G = require('./G');

var co       = require('co');
var thunkify = require('thunkify');



var js = function(o, indent) {
    return JSON.stringify(o, null,
        (indent ? '  ' : undefined)
    );
};



G('./s1.db', function(err, g) { // regular file-backed
//G(           function(err, g) { // memory-only
    if (err) { return console.error(err); }



    // abstract async with co and thunkify O:)
    var gg = {};
    'cA cAs cV cVs dA dAs dV dVs eA fAs fAsAsync fVs gA gAAll gAs gV gVAll gVs sAs'.split(' ').forEach(function(fnName) {
        gg[fnName] = thunkify( g[fnName] );
    });
    //console.log(Object.keys(g ).sort().join(' ')); console.log(Object.keys(gg).sort().join(' '));



    var part = parseInt(process.argv.slice().pop(), 10);

    co(function *() {
        if (part === 0) {

            var vIds = yield gg.cVs([
                {name:'José Pedro',      gender:'m', bornAt:'1981/01/12'},
                {name:'Margarida',       gender:'f', bornAt:'1980/11/16'},
                {name:'Maria',           gender:'f', bornAt:'2012/03/17'},
                {name:'José Augusto',    gender:'m', bornAt:'1952/03/05'},
                {name:'Maria de Lurdes', gender:'f', bornAt:'1952/03/01'},
                {name:'Vera Susana',     gender:'f', bornAt:'1975/04/11'}
            ]);
            console.log('vIds:', js(vIds));


            var vZP  = vIds[0];
            var vGui = vIds[1];
            var vMi  = vIds[2];
            var vPai = vIds[3];
            var vMae = vIds[4];
            var vSu  = vIds[5];
            var aIds = yield gg.cAs([
                {subject:vZP,  predicate:'isParentOf', object:vMi, role:'father'},
                {subject:vGui, predicate:'isParentOf', object:vMi, role:'mother'},
                {subject:vPai, predicate:'isParentOf', object:vZP, role:'father'},
                {subject:vMae, predicate:'isParentOf', object:vZP, role:'mother'},
                {subject:vPai, predicate:'isParentOf', object:vSu, role:'father'},
                {subject:vMae, predicate:'isParentOf', object:vSu, role:'mother'}
            ]);
            console.log('aIds:', js(aIds));


            var res = yield gg.sAs(vMae, 'isParentOf', undefined, true);
            console.log('children of Maria de Lurdes:');
            res.forEach(function(aO) {
                console.log(aO.object.name);
            });


            var isZpParentOfMi = yield gg.eA(vZP, 'isParentOf', vMi);
            console.log(isZpParentOfMi);

            return;
        }
        else if (part === 1) {
            var vZP = yield gg.fVs(function(vO) {
                return (vO.name === 'José Pedro');
            });
            vZP = vZP[0];
            console.log(vZP);
            vZP.hairColor = 'brown';
            yield gg.cV(vZP);
        }
        else if (part === 2) {
            var aIds = yield gg.gAAll(); // TODO
            console.log('aIds:'+ js(aIds));
            yield gg.dAs(aIds);

            var vIds = yield gg.gVAll();
            console.log('vIds:'+ js(vIds));
            yield gg.dVs(vIds);
        }
        else if (part === 3) {
            var t = yield gg.gVAll(true);
            //console.log('gVAll:\n' + js(t, 1));

            t = yield gg.gAAll(true);
            //console.log('\ngAAll:\n' + js(t, 1));

            t = yield gg.fVs(
                function(vO) { // filter function, maps vO -> Boolean
                    return vO.gender === 'f';
                }
                //,['vtx:1', 'vtx:2'], // optional id of vertices (all if ommitted)
            );
            console.log('fVs:\n' + js(t, 1));

            t = yield gg.fAs(
                function(aO) { // filter function, maps aO -> Boolean
                    return aO.role === 'father';
                }
                //,['vtx:1', 'vtx:2'], // optional id of vertices (all if ommitted)
            );
            console.log('fAs:\n' + js(t, 1));
        }
        else if (part === 4) {
            // TODO sA, eA
        }
    })();

});
