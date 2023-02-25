Array.prototype.sample = function (n) {
    const indexes = this.map((_, i) => i);
    return new Array(n)
        .fill(x => undefined)
        .map(() => this[(indexes.splice(Math.random() * indexes.length, 1)[0])]);
}
Array.prototype.groupBy = function (keyFunc) {
    if (typeof (keyFunc) !== 'function')
        throw 'keyFunc must be a function';
    return this.reduce((a, v) => {
        const k = keyFunc(v);
        if (a[k] === undefined)
            a[k] = [];
        a[k].push(v);
        return a;
    }, {});
}
Array.prototype.distinct = function (keyFunc) {
    if (keyFunc === undefined)
        return Array.from(new Set(this));
    if (typeof (keyFunc) !== 'function')
        throw 'keyFunc must be a function';
    return this.reduce((a, v) => {
        const k = keyFunc(v);
        if (a[k] === undefined)
            a[k] = v;
        return a;
    }, {});
}

// ==============================================================================

class Node {
    #key = null;
    #value = null;
    #type = null;
    #edgeNodes = [];

    parent = null;
    searched = false;

    constructor(value, type) {
        this.#key = Graph.getKey(value, type);
        this.#value = value;
        this.#type = type;
    }

    get key() { return this.#key; }
    get value() { return this.#value; }
    get type() { return this.#type; }
    get edgeNodes() { return this.#edgeNodes; }

    addEdge(node) {
        this.#edgeNodes.push(node);
        node.#edgeNodes.push(this);
    }
}
class Graph {
    #nodes = [];
    #lookup = {};

    constructor() { }

    addNode(node) {
        if (this.#lookup[node.key] != undefined)
            throw `Node ${node.value} of type ${node.type} already exists.`;

        this.#nodes.push(node);
        this.#lookup[node.key] = node;
        return node;
    }
    getNode(value, type) {
        const key = Graph.getKey(value, type);
        return this.#lookup[key];
    }
    search(aValue, aType, bValue, bType) {
        return this.searchKeys(Graph.getKey(aValue, aType), Graph.getKey(bValue, bType))
    }
    searchKeys(akey, bKey) {
        const start = this.#lookup[akey];
        const goal = this.#lookup[bKey];
        if (start === undefined)
            throw `${akey} does not exist`;
        if (goal === undefined)
            throw `${bKey} does not exist`;

        const result = [];
        const queue = [];
        start.searched = true;
        queue.push(start);

        while (queue.length > 0) {
            let current = queue.shift();
            if (current == goal) {
                result.push(current)
                while (current = current.parent)
                    result.push(current);
                break;
            }
            for (const edge of current.edgeNodes) {
                if (edge.searched) continue;
                edge.searched = true;
                edge.parent = current;
                queue.push(edge);
            }
        }

        for (const node of this.#nodes) {
            node.parent = null;
            node.searched = false;
        }
        return result;
    }
    static getKey(value, type) {
        return `${type}-${value}`;
    }
}

// ==============================================================================

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./movies.json', 'utf8'));
const movies = data.movies;

let graph = new Graph();

for (const movie of movies) {
    const m_node = new Node(movie.title, 'movie');
    graph.addNode(m_node);

    for (const actor of movie.cast) {
        let a_node = graph.getNode(actor, 'actor');
        if (a_node === undefined) {
            a_node = new Node(actor, 'actor');
            graph.addNode(a_node);
        }
        m_node.addEdge(a_node);
    }
}

console.log(graph);

const cast = movies.map(x => x.cast).flat().distinct().sort();
console.log(cast);

const goal = Graph.getKey('Kevin Bacon', 'actor');
cast
    //.sample(50)
    .map(x => Graph.getKey(x, 'actor'))
    .map(start => graph.searchKeys(start, goal))
    .forEach(res => {
        if (res.length === 0) console.log('** No Relation.');
        console.log('** ' + res.reverse().map(x => x.key).join(' --> '));
    });