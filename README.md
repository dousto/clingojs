# clingojs
----------

A Node.js wrapper module for the Clingo program.

```
npm install clingojs
```

This module requires Clingo to be installed to work. Recently it has been tested with Clingo 5.4.0 but likely works with other versions as well.

## Basic Usage
--------------

```javascript
var Clingo = require('clingojs');

var clingo = new Clingo();

clingo.config({ // Sets the basic configuration for this clingo instance
	maxModels: 0 // Return all models
});

clingo.solve({
	inputFiles: ['/path/to/some/file']
})
	.on('model', function(model) {
		// Here 'model' is an Array of strings representing the atoms of the model
		// e.g. ['example(0)', 'example(1)']
	})
	.on('end', function() {
		// This function gets called after all models have been received
	});
```

## Class: Clingo

### Clingo([options])

The Clingo constructor takes an optional _options_ argument containing configuration options detailed in the [__Configuration__](#configuration) section.

### clingo.config([options])

If options argument is present, merges the _options_ object into the configuration of this clingo instance and returns the instance.

If _options_ is missing, returns the configuration object of this clingo instance.

### clingo.setConfig(config)

Completely replaces this instance's configuration object with _config_.

### clingo.solve([options])

Starts the Clingo process. The process uses the instance's configuration, in addition to any other configurations passed in the _options_ argument. Note: Any configurations passed in _options_ do not last beyond the solve() function.

Returns an object of the form { on: [Function] }. See the [__Basic Usage__](#basic-usage) section for an example.

## Configuration

The following sections document the different options that can be passed to the _config()_, _setConfig()_, and _solve()_ functions.

### clingo

A string which specifies the clingo command. May be a full path, or just the name of the executable if it is on the environment's path.

```javascript
var clingo = new Clingo({
	clingo: '/usr/bin/clingo'
});
```

Default: 'clingo'

### maxModels

The maximum number of models to find. If maxModels is 0 then all models are found.

```javascript
var clingo = new Clingo({
	maxModels: 0
});
```

Default: 1

### constants

An object to specify clingo constants. This uses the clingo '-c' argument.

```javascript
var clingo = new Clingo({
	constants: { foo: 0, bar = 1 } // The same as passing '-c foo=0,bar=1' on the command line
});
```

Default: {}

### inputFiles

An array of input files for the clingo process to read in. These files should be written using gringo syntax.

```javascript
var clingo = new Clingo({
	inputFiles: ['/path/to/file', '/path/to/otherFile']
});
```

Default: []

### input

The input config property defines input which is to be written to the process' stdin when _solve()_ is called. It can be one of the following:

- string: A string is written as it appears to stdin.
- Array: An Array will be interpreted as atoms, the written to stdin. For example, the array ['example(0)', 'example(1)'] will be written as 'example(0). example(1).'
- Readable stream: A Readable stream will be piped to stdin.
- Object: Any other object not listed above will have the output of its _toString()_ written to stdin.

```javascript
var clingo = new Clingo({
	input: 'tobe | not tobe.'
});
```

Default: undefined

### args

Defines any additional arguments to start the clingo process with.

```javascript
var clingo = new Clingo({
	args: ['--time-limit=10']
});
```

Default: []

### returnStdin

When set to _true_, the clingo process' stdin will be left open to be further written to. When _solve()_ is invoked, the returned object will then have a _stdin_ property which is a Writable stream. Don't forget to call _stdin.end()_ or the process will not exit.

```javascript
var clingo = new Clingo({
	returnStdin: true
})

var ps = clingo.solve({
	//... options
});

ps.stdin.write('I can write more to the process stdin!');
ps.stdin.end();
```

Default: false

### returnStdout

When set to _true_, this bypasses the module's own interpreting of the process output, and instead returns the process stdout as a property of the object returned from _solve()_.

```javascript
var clingo = new Clingo({
	returnStdout: true
})

var ps = clingo.solve({
	//... options
});

ps.stdout.setEncoding('utf8');
ps.stdout.on('data', function(data) {
	// This is where you would read the process output directly
});
ps.stdout.on('end', function() {
	// Called when the output has been fully read
})
```

Default: false
