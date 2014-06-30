'use strict';



var lvl     = require('levelup');
var memdown = require('memdown');
var async   = require('async');



var n10To32 = function(b10) { return (b10).toString(32); };
var n32To10 = function(b32) { return parseInt(b32, 32);  };
var incrementId = function(oldId) {
    if (!oldId) { oldId = 0; }
    return n10To32( n32To10(oldId) + 1 );
};

var clone = function(o) {
    return JSON.parse( JSON.stringify(o) );
};

var merge = function(to, from) {
    for (var fk in from) {
        if (!(fk in to)) {
            to[fk] = from[fk];
        }
    }
    return to;
};

var ts = function() {
    return Date.now();
};



/*
 * hexastore:
 *   spo,sop,pos,pso,osp,ops : <id> : predicate : <id>
 *
 * fabio -> {name:'fábio', _t:'v', _l:'person'}
 * arroz -> {name:'arroz', _t:'v', _l:'food'}
 * likes -> nothing
 * spo:fabio:likes:arroz -> nothing
 * sop:fabio:arroz:likes -> nothing
 * ..
 *
 * counters:
 *   cnt : <name> -> <nr>
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
        var api = {};

        var nextId = function(kind, cb) {
            var k = ['cnt:', kind].join('');
            db.get(k, function(err, currId) {
                //if (err) { return cb(err); }

                var newId = incrementId(currId);
                db.put(k, newId, function(err) {
                    if (err) { return cb(err); }

                    cb(null, [kind, ':', newId].join(''));
                });
            });
        };



        // CREATE|UPDATE

        api.cV = function(vO, cb) {
            var vId = vO._i;
            var t = ts();

            var onceDone = function() {
                var vOS;
                try {
                    vOS = JSON.stringify(vO);
                    vO._t = 'v';
                    vO._i = vId;
                } catch (ex) {
                    return cb(ex);
                }

                db.put(vId, vOS, function(err) {
                    if (err) { return cb(err); }

                    return cb(null, vId);
                });
            };

            vO._mt = t;

            if (vId) {
                delete vO._t;
                delete vO._i;
                return onceDone();
            }
            else {
                vO._ct = t;
            }

            nextId('vtx', function(err, newId) {
                if (err) { return cb(err); }

                vId = newId;

                onceDone();
            });
        };

        api.cVs = function(vOs, cb) {
            async.mapSeries(vOs, api.cV, cb);
        };

        api.cA = function(o, cb) {
            var t = ts();
            var aId = o._i;
            var isNew = !aId;

            o._mt = t;
            if (isNew) {
                o._ct = t;
                try {
                    aId = api._gAInv(o);
                } catch (ex) {
                    return cb(ex);
                }
            }
            else {
                delete o._t;
                delete o._i;
            }

            var o2 = clone(o); // will retain extra params
            o._t = 'a';
            o._i = aId;

            var sub = o.subject;
            var pre = o.predicate;
            var obj = o.object;

            delete o2.subject;
            delete o2.predicate;
            delete o2.object;

            if (typeof sub === 'object') { sub = sub._i; }
            if (typeof obj === 'object') { obj = obj._i; }
            sub = sub.substring(4);
            obj = obj.substring(4);

            var o2S = JSON.stringify(o2);

            var onceDone = function(err) {
                if (err) { return cb(err); }

                cb(null, aId);
            };

            if (!isNew) {
                return db.put(aId, o2S, onceDone);
            }

            db.batch([
                {type:'put', key:['spo', sub, pre, obj].join(':'), value:o2S},
                {type:'put', key:['sop', sub, obj, pre].join(':'), value:' '},
                {type:'put', key:['pos', pre, obj, sub].join(':'), value:' '},
                {type:'put', key:['pso', pre, sub, obj].join(':'), value:' '},
                {type:'put', key:['osp', obj, sub, pre].join(':'), value:' '},
                {type:'put', key:['ops', obj, pre, sub].join(':'), value:' '}
            ], onceDone);
        };

        api.cAs = function(aOs, cb) {
            async.mapSeries(aOs, api.cA, cb);
        };



        // GET

        api.gV = function(vId, cb) {
            db.get(vId, function(err, vOS) {
                if (err) { return cb(err); }

                var vO;
                try {
                    vO = JSON.parse(vOS);
                    vO._i = vId;
                    vO._t = 'v';
                } catch (ex) {
                    return cb(ex);
                }

                cb(null, vO);
            });
        };

        api.gVs = function(vIds, cb) {
            async.map(vIds, api.gV, cb);
        };

        api.gVAll = function(fetchObjects, cb) {
            if (cb === undefined) {
                cb = fetchObjects;
                fetchObjects = false;
            }

            var s = 'vtx:';
            var res = [];

            db.createReadStream({
                values: false,
                start: s,
                end:   s + '\xff'
            })
            .on('data', function(k) {
                res.push(k);
            })
            .on('end', function() {
                if (!fetchObjects) {
                    return cb(null, res);
                }

                var gV = function(k, cb) {
                    api.gV(k, cb);
                };
                async.map(res, gV, cb);
            });
        };

        api._gA = function(key, skipVPrefix) {
            var vPrefix = skipVPrefix ? '' : 'vtx:';
            var parts = key.substring(0, 3).split('');
            var vals  = key.substring(4).split(':');
            return {
                subject:   vPrefix + vals[ parts.indexOf('s') ],
                predicate:           vals[ parts.indexOf('p') ],
                object:    vPrefix + vals[ parts.indexOf('o') ]
            };
        };

        api._gAInv = function(aO) {
            return ['spo', aO.subject.substring(4), aO.predicate, aO.object.substring(4)].join(':');
        };

        api.gA = function(key, fetchVertices, cb) {
            if (cb === undefined) {
                cb = fetchVertices;
                fetchVertices = false;
            }

            var aO = api._gA(key);
            var aId = api._gAInv(aO);
            aO._t = 'a';
            aO._i = aId;

            if (!fetchVertices) {
                return cb(null, aO);
            }

            var left = 3;
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

                if (this._x !== 'extra') {
                    vO._t = 'v';
                    vO._i = aO[this._x];
                    aO[this._x] = vO;
                }
                else {
                    merge(aO, vO);
                }

                if (left === 0) {
                    cb(null, aO);
                }
            };

            db.get(aId,        onResult.bind({_x:'extra'}));
            db.get(aO.subject, onResult.bind({_x:'subject'}));
            db.get(aO.object,  onResult.bind({_x:'object' }));
        };

        api.gAs = function(aIds, fetchVertices, cb) {
            var gA = function(aId, cb2) {
                api.gA(aId, fetchVertices, cb2);
            };
            async.map(aIds, gA, cb);
        };

        api.gAAll = function(fetchVertices, cb) {
            if (cb === undefined) {
                cb = fetchVertices;
                fetchVertices = false;
            }

            var s = 'spo:';
            var res = [];

            db.createReadStream({
                values: false,
                start: s,
                end:   s + '\xff'
            })
            .on('data', function(k) {
                res.push(k);
            })
            .on('end', function() {
                if (!fetchVertices) {
                    return cb(null, res);
                }

                var gA = function(k, cb) {
                    api.gA(k, true, cb);
                };
                async.map(res, gA, cb);
            });
        };



        // DELETE

        api.dV = function(v, cb) {
            var vId = ((typeof v === 'string') ? v : v._i);

            // get arcs to or from the vertex
            var gAs = function(args, cb) {
                api.gAs(args[0], args[2], args[2], cb);
            };
            async.map(
                [
                    [v,         undefined, undefined],
                    [undefined, undefined, v]
                ],
                gAs,
                function(err, arcIds) {
                    if (err) { return cb(err); }

                    // join both sources
                    arcIds = arcIds[0].concat(arcIds[1]);

                    // delete arcs to or from the vertex
                    async.map(arcIds, api.dA, function(err) {
                        if (err) { return cb(err); }

                        // delete the vertex itself
                        db.del(vId, cb);
                    });
                }
            );
        };

        api.dVs = function(vOs, cb) {
            async.map(vOs, api.dV, cb);
        };

        api.dA = function(o, cb) {
            var sub, pre, obj;
            if (typeof o === 'string') {
                o = api._gA(o, true);
                sub = o.subject;
                pre = o.predicate;
                obj = o.object;
            }
            else {
                sub = o.subject;
                pre = o.predicate;
                obj = o.object;

                if (typeof sub === 'object') { sub = sub._i; }
                if (typeof obj === 'object') { obj = obj._i; }
                sub = sub.substring(4);
                obj = obj.substring(4);
            }

            db.batch([
                {type:'del', key:['spo', sub, pre, obj].join(':')},
                {type:'del', key:['sop', sub, obj, pre].join(':')},
                {type:'del', key:['pos', pre, obj, sub].join(':')},
                {type:'del', key:['pso', pre, sub, obj].join(':')},
                {type:'del', key:['osp', obj, sub, pre].join(':')},
                {type:'del', key:['ops', obj, pre, sub].join(':')}
            ], cb);
        };

        api.dAs = function(aOs, cb) {
            async.map(aOs, api.dA, cb);
        };



        // FILTER

        api.fVs = function(filterFn, vertices, cb) {
            var onceDone = function() {
                var res = vertices.filter(filterFn);
                cb(null, res);
            };

            if (cb === undefined) {
                cb = vertices;
                vertices = undefined;
                api.gVAll(true, function(err, vertices_) {
                    if (err) { return cb(err); }

                    vertices = vertices_;
                    onceDone();
                });
                return;
            }

            if (vertices.length > 0 && typeof vertices[0] === 'string') {
                api.gVs(vertices, function(err, vertices_) {
                    if (err) { return cb(err); }

                    vertices = vertices_;
                    onceDone();
                });
            }
            else {
                onceDone();
            }
        };

        api.fAs = function(filterFn, arcs, cb) {
            var onceDone = function() {
                var res = arcs.filter(filterFn);
                cb(null, res);
            };

            if (cb === undefined) {
                cb = arcs;
                arcs = undefined;
                api.gAAll(true, function(err, arcs_) {
                    if (err) { return cb(err); }

                    arcs = arcs_;
                    onceDone();
                });
                return;
            }

            if (arcs.length > 0 && typeof arcs[0] === 'string') {
                api.gAs(arcs, true, function(err, arcs_) {
                    if (err) { return cb(err); }

                    arcs = arcs_;
                    onceDone();
                });
            }
            else {
                onceDone();
            }
        };

        api.fAsAsync = function(filterFnAsync, arcs, cb) { // TODO NOT FINISHED
            var onceDone = function() {
                try {
                    async.filter(arcs, filterFnAsync, function(res) { cb(null, res); });
                } catch (ex) {
                    cb(ex);
                }
            };

            if (cb === undefined) {
                cb = arcs;
                arcs = undefined;
                api.gAAll(false, function(err, arcs_) {
                    if (err) { return cb(err); }

                    arcs = arcs_;
                    onceDone();
                });
                return;
            }

            return onceDone();
        };



        // SEARCH

        api.eA = function(sub, pre, obj, cb) {
            if (typeof sub === 'object') { sub = sub._i; }
            if (typeof obj === 'object') { obj = obj._i; }
            if (sub) { sub = sub.substring(4); }
            if (obj) { obj = obj.substring(4); }

            db.get(['spo', sub, pre, obj].join(':'), function(err) {
                cb(null, !err);
            });
        };

        api.sAs = function(sub, pre, obj, fetchAll, cb) {
            /*jshint maxcomplexity:20*/
            if (!cb) {
                cb = fetchAll;
                fetchAll = false;
            }

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
                if (!fetchAll) {
                    return cb(null, res);
                }

                var gA = function(k, cb) {
                    api.gA(k, true, cb);
                };

                async.map(res, gA, cb);
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
