# motivation

After having a go at [neo4J](http://www.neo4j.org/) and watching
[@matteocollina](https://twitter.com/@matteocollina)'s
[How to Cook a Graph Database in a Night](http://nodejsconfit.levelgraph.io/) presentation,
I'm attempting implementing a simple graphdb with JS and leveldb.


# roadmap

* ~~DONE~~ id counters 
* ~~DONE~~ hexastore implementation (put and fetch back)
* ~~DONE~~ improved API and added additional properties for arcs

* add timestamps to vertices and arcs? _ct, _mt
* property indexes (bags)
* unique property indexes
* make co play nice with leveldown plz (readable examples!)
* graph traversal
* querying language?
* add unit tests


# API

```javascript
G({Function}cb)
// returns memory-only db g

G({String}path, {Function}cb)
// returns regular db g

----

g.cV(
    {Object}   vertexO,
    {Function} cb
)
// creates/updates a vertex, returning it's id and updating fields in the given object

g.gV(
    {String}   vertexId,
    {Function} cb
)
// returns the vertex document

g.cA(
    {Object}   arc
    {Function} cb
)
// creates/updates an arc.
// arc must have at least subject (either id or object), predicate (string) and object (either id or object)
// creates an arc from subject to object via predicate, returning it's id and updating fields in the give object
// assuming updates haven't changed either s, p or o!

g.gA(
    {String}    k,
    {Boolean}  [fetchVertices=false],
    {Function}  cb
)
// from one of the 6 hexastore keys, returns the arc

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
