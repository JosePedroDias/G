var lvl = require('levelup');

var dbPath = process.argv.slice().pop();

lvl(dbPath, function(err, db) {
    if (err) {
        console.log('syntax: node listDb <dbPath>');
        return console.error(err);
    }

    var O = {
        v: 0, // vertices
        a: 0, // arcs
        i: 0, // indices
        c: 0, // counters
        b: 0  // bytes?
    };

    db.createReadStream()
        .on('data', function(o) {
            O.b += o.key.length + o.value.length;
            var k = 'a';
            var c = o.key[0];
            if      (c === 'v') { k = 'v'; }
            else if (c === 'i') { k = 'i'; }
            else if (c === 'c') { k = 'c'; }
            O[k] += 1;
            console.log(o.key, '->', o.value);
        })
        .on('end', function() {
            O.a /= 6;
            console.log('');//END VISITING ALL ITEMS');
            console.log(JSON.stringify(O, null, '  '));
        });
    return; // TRAVERSE
});
