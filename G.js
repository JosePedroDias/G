var lvl     = require('level');
var memdown = require('memdown');



var n10To32 = function(b10) { return (b10).toString(32); };
var n32To10 = function(b32) { return parseInt(b32, 32);  };
var incrementId = function(oldId) {
    if (!oldId) { oldId = 0; }
    return n10To32( n32To10(oldId) + 1 );
};

/*var ts = function() {
    return Date.now();
};*/


/**
 *
 * hexastore:
 *   spo,sop,pos,pso,osp,ops : <id> : <id> : <id> -> 
 *
 * fabio = {name:'fábio', _t:'v', _l:'person'}
 * arroz = {name:'arroz', _t:'v', _l:'food'}
 * gostarDe = nada
 * spo:fabio:gostar_de:arroz = {quantoGosta:'bués'}
 * sop:fabio:arroz:gostar_de = nada
 * spo:fabio:gostar_de:arroz = nada
 * spo:fabio:gostar_de:arroz = nada
 * spo:fabio:gostar_de:arroz = nada
 *
 * counters:
 *   cnt : <name> : <nr>
 *
 * documents (for vertex and arc):
 *   vtx: <id>
 *   arc: <id>
 *
 * unique indices:
 *   vun: <propName>
 *   aun: <propName>
 *
 * bag indices (labels):
 *   vin: <propName>
 *   ain: <propName>
 */


/**
 * G(db, cb(err, g)) regular
 * G(    cb(err, g)) memory-only
 */
var G = function() {

    var whenGIsReadyCb;

    var onDb = function(err, db) {
        if (0) {
            db.createReadStream()
                .on('data', function(o) { console.log(o); })
                .on('end', function() { console.log('END'); });
            return; // TRAVERSE
        }


        var api = {};

        var nextId = function(kind, cb) {
            var highestId;
            db.createReadStream({
                reverse: true,
                limit:   1,
                values:  false,
                keys:    true,
                start:   ['cnt:', kind, ':\xff'].join(''),
                end:     ['cnt:', kind         ].join('')
            })
            .on('data', function(k) {
                highestId = k;
            })
            .on('error', function(err) { cb(err); })
            .on('end', function() {
                if (highestId) {
                    var cutAt = highestId.lastIndexOf(':');
                    highestId = highestId.substring(cutAt+1);
                }
                var newId = incrementId(highestId);
                db.put(['cnt:', kind, ':', newId].join(''), ' ');
                cb(null, [kind, ':', newId].join(''));
            });
        };

        api.cV = function(vO, cb) {
            nextId('vtx', function(err, newId) {
                if (err) { return cb(err); }
                vO._i = newId; // id
                vO._t = 'v';   // type
                //var t = ts();
                //vO._ct = t;   // creation time
                //vO._mt = t;   // modification time
                var vOS;
                try {
                    vOS = JSON.stringify(vO);
                } catch (ex) {
                    return cb(ex);
                }

                db.put(newId, vOS, function(err) {
                    if (err) { return cb(err); }
                    return cb(null, newId);
                });
            });
        };

        api.gV = function(vId, cb) {
            db.get(vId, function(err, vOS) {
                if (err) { return cb(err); }

                var vO;
                try {
                    vO = JSON.parse(vOS);
                } catch (ex) {
                    return cb(ex);
                }

                cb(null, vO);
            });
        };

        api.cA = function(sub, pre, obj, cb) {
            if (typeof sub === 'object') { sub = sub._i; }
            if (typeof obj === 'object') { obj = obj._i; }
            sub = sub.substring(4);
            obj = obj.substring(4);
            db.batch([
                {type:'put', key:['spo', sub, pre, obj].join(':'), value:' '},
                {type:'put', key:['sop', sub, obj, pre].join(':'), value:' '},
                {type:'put', key:['pos', pre, obj, sub].join(':'), value:' '},
                {type:'put', key:['pso', pre, sub, obj].join(':'), value:' '},
                {type:'put', key:['osp', obj, sub, pre].join(':'), value:' '},
                {type:'put', key:['ops', obj, pre, sub].join(':'), value:' '}
            ], cb);
        };

        api._gA = function(key) {
            var parts = key.substring(0, 3).split('');
            var vals  = key.substring(4).split(':');
            return {
                subject:   'vtx:' + vals[ parts.indexOf('s') ],
                predicate:          vals[ parts.indexOf('p') ],
                object:    'vtx:' + vals[ parts.indexOf('o') ]
            };
        };

        api.gA = function(key, fetchVertices, cb) {
            if (cb === undefined) {
                cb = fetchVertices;
                fetchVertices = false;
            }

            var aO = api._gA(key);

            if (!fetchVertices) {
                return cb(null, aO);
            }

            var left = 2;
            var errOccurred = false;

            var onResult = function(err, vOS) {
                var vO;
                try {
                    vO = JSON.parse(vOS);
                } catch (ex) {
                    err = err || ex;
                }

                if (err) {
                    if (errOccurred) { return; } // so it doesn't call twice
                    errOccurred = true;
                    return cb(err);
                }

                --left;
                aO[this] = vO;

                if (left === 0) {
                    cb(null, aO);
                }
            };

            db.get(aO.subject, onResult.bind('subject'));
            db.get(aO.object,  onResult.bind('object' ));
        };

        api.gAs = function(sub, pre, obj, cb) {
            if (typeof sub === 'object') { sub = sub._i; }
            if (typeof obj === 'object') { obj = obj._i; }
            if (sub) { sub = sub.substring(4); }
            if (obj) { obj = obj.substring(4); }

            var s, res = [];
            if (sub) {
                if (pre && obj) { s = ['spo', sub, pre, obj].join(':'); }
                else if (pre) { s = ['spo', sub, pre].join(':'); }
                else if (obj) { s = ['sop', sub, obj].join(':'); }
                else {          s = ['spo', sub, '' ].join(':'); }
            }
            else if (pre) {
                if      (obj) { s = ['pos', pre, obj].join(':'); }
                else if (sub) { s = ['pso', pre, sub].join(':'); }
                else {          s = ['pos', pre, '' ].join(':'); }
            }
            else if (obj) {
                if      (sub) { s = ['osp', obj, sub].join(':'); }
                else if (pre) { s = ['ops', obj, pre].join(':'); }
                else {          s = ['osp', obj, '' ].join(':'); }
            }
            else {
                return cb('at least one of sub,pre,obj must be entered!');
            }
            db.createReadStream({
                values: false,
                start: s,
                end:   s + '\xff'
            })
            .on('data', function(k) {
                res.push(k);
            })
            .on('end', function() {
                cb(null, res);
            });
        };

        whenGIsReadyCb(null, api);
    };

    try {

        if (arguments.length === 1) {
            whenGIsReadyCb = arguments[0];
            lvl({db:memdown}, onDb);
        }
        else if (arguments.length === 2) {
            whenGIsReadyCb = arguments[1];
            lvl(arguments[0], onDb);
        }
        else {
            throw 'syntax: G([{String}db], cb(err, g) {})';
        }

    } catch (ex) {
        whenGIsReadyCb(ex);
    }
};



module.exports = G;
