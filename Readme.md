![](https://img.skitch.com/20110428-mj866c1cp813g57yuj7jb615dm.jpg)

Gitface is my experimental git commit viewer/visualiser.

Its an itch scratching of

* me playing with node.js and d3.js
* visualising git commits (particularly with non-topological sorting)
* experimenting with git structure more deeply

## You need

* node.js 0.4.6-ish

via npm

* express
* jade
* underscore
* async

## run it

Run with `bin/gitface`. You can symlink this into your path.

### Start the server

    $ gitface serve

### View your repo using gitface (OSX only)

    $ cd /path/to/your/repo
    $ gitface

This opens your browser to the right url.

## problems

Its hard coded to my team at the moment.
