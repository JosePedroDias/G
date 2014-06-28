# motivation

After having a go at [neo4J](http://www.neo4j.org/) and watching
[@matteocollina](https://twitter.com/@matteocollina)'s
[How to Cook a Graph Database in a Night](http://nodejsconfit.levelgraph.io/) presentation
[project repos](https://github.com/mcollina/levelgraph),
I'm attempting implementing a simple graphdb with JS and leveldb.


# algorithms

* [Hexastore: sextuple indexing for semantic web data management C Weiss, P Karras, A Bernstein - Proceedings of the VLDB Endowment, 2008](http://www.vldb.org/pvldb/1/1453965.pdf)


# roadmap

* ~~DONE~~ id counters 
* ~~DONE~~ hexastore implementation (put and fetch back)
* ~~DONE~~ improved API and added additional properties for arcs
* ~~DONE~~ add timestamps to vertices and arcs? _ct, _mt
* ~~DONE~~ vertex and arc removal
* property indexes (bags)
* unique property indexes
* graph events (vCreated, aCreated, vUpdated, aUpdated, vDeleted, aDeleted)
* make co play nice with leveldown plz (readable examples!)
* graph traversal
* querying language?
* add unit tests


# API

```javascript

// GRAPHDB STARTUP

G({Function}cb)
// returns memory-only db g

G({String}path, {Function}cb)
// returns regular db g


----


// CREATE/UPDATE

g.cV(
    {Object}   vertexO,
    {Function} cb
)
// creates/updates a vertex, returning it's id and updating fields in the given object


g.cA(
    {Object}   arc
    {Function} cb
)
// creates/updates an arc.
// arc must have at least subject (either id or object), predicate (string) and object (either id or object)
// creates an arc from subject to object via predicate, returning it's id and updating fields in the give object
// assuming updates haven't changed either s, p or o!
// the property ._i isn't supposed to be changed
// the property ._t is there just to help you interpret the object, won't be persisted
// the properties ._ct and ._mt are auto-populated with timestamps


----


// GETS

g.gV(
    {String}   vertexId,
    {Function} cb
)
// returns the vertex document


g.gA(
    {String}    k,
    {Boolean}  [fetchVertices=false],
    {Function}  cb
)
// from one of the 6 hexastore keys, returns the arc


----


// DELETE

g.dV(
    {String|Object} vertex
    {Function}      cb
)
// deletes the give vertex
// also deletes any arcs where the vertex is either subject or object


g.dA(
    {String|Object} arc
    {Function}      cb
)
// deletes the given arc


----


// SEARCH

g.gAs(
    {String|Object|undefined}  subject,
    {String|undefined}         predicate,
    {String|Object|undefined}  object,
    {Boolean}                 [fetchAll=false],
    {Function}                 cb
)
// accepts 1 to 3 filled arguments, returns matched arcs
// if fetchAll is ommitted or falsy, oncy arc keys are returned, otherwise their objects and vertices are filled
```


# limitations

* there can't be more than 1 arc from v1 to v2 named x
* no node traversal whatsoever so far
