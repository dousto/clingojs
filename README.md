# clingojs
----------

A wrapper module for the Clingo program.

This module requires Clingo to be installed to work. Tested with Clingo 4.2.1 but likely works with other versions as well.

## Basic Usage
--------------

```javascript
var Clingo = require('clingo');

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

### clingo.config([options])

If options argument is present, merges the _options_ object into the configuration of this clingo instance and returns the instance.

If _options_ is missing, returns the configuration object of this clingo instance.

### clingo.setConfig(config)

Completely replaces this instance's configuration object with _config_.

### clingo.solve([options])

Starts the Clingo process. The process uses the instances configuration, in addition to any other configurations passed in the options _options_ argument. Note: Any configurations passed in _options_ do not last beyond the solve() function.

Returns an object of the form { on: [Function] }. See the __Basic Usage__ section for an example.