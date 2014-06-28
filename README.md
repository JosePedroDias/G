# motivation

After having a go at [neo4J](http://www.neo4j.org/) and watching
[@matteocollina](https://twitter.com/@matteocollina)'s
[How to Cook a Graph Database in a Night](http://nodejsconfit.levelgraph.io/) presentation,
I'm attempting implementing a simple graphdb with JS and leveldb.


# roadmap

* id counters ~~DONE~~
* hexastore implementation (put and fetch back) ~~DONE~~
* property indexes (bags)
* unique property indexes
* graph traversal
* querying language?


# API

```javascript
G({Function}cb)
// return memory-only db g

G({String}path, {Function}cb)
// returns regular db g

----

g.cV(
	{Object}   vertexO,
	{Function} cb
)
// creates a vertex, returing it's id and updating fields in the given object

g.gV(
	{String}   vertexId,
	{Function} cb
)
// returns the vertex document

g.cA(
	{String|Object} subject,
	{String}        predicate,
	{String|Object} object,
	{Function}      cb
)
// creates an arc from subject to object via predicate

g.gA(
	 {String}   k,
	[{Boolean}  fetchVertices=false],
	 {Function} cb
)
// from one of the 6 hexastore keys, returns the arc

g.gAs(
	{String|Object|undefined} subject,
	{String|undefined}        predicate,
	{String|Object|undefined} object,
	{Function}                cb
)
// accepts 1 to 3 filled arguments, returns matched arcs
```


# limitations

* there can't be more than 1 arc from v1 to v2 named x
* no node traversal whatsoever so far
