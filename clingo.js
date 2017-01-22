var spawn = require('child_process').spawn;
var Readable = require('stream').Readable;

var Clingo = function(config) {
    if (config) {
        this._config = config;
    } else {
        this._config = {
            clingo: 'clingo',
            maxModels: 1
        };
    }
};

// Completely replaces the base configuration (_config) with the new one
Clingo.prototype.setConfig = function(newConfig) {
    this._config = newConfig;

    return this;
};

// Merges the passed in configuration with the base config
// Returns the config object if no argument passed
Clingo.prototype.config = function(newConfig) {
    // Return current config if no new config is passed
    if (!newConfig) return this._config;

    this._config = mergeConfigs(this._config, newConfig);

    return this;
};

// Config options in secondConfig dominate firstConfig
var mergeConfigs = function(baseConfig, secondConfig) {

    // Do the merge
    for (var varName in secondConfig) {
        baseConfig[varName] = secondConfig[varName];
    }

    return baseConfig;
};

Clingo.prototype.validateConfig = function() {
    if (typeof this._config !== 'object') {
        throw new Error('Config is either undefined or not a valid object.')
    }
    if (typeof this._config.clingo !== 'string') {
        throw new Error('Config property \'clingo\' must be a string.');
    }
    if (this._config.maxModels && typeof this._config.maxModels !== 'number') {
        throw new Error('Config property \'maxModels\' (when specified) must be a number.');
    }

    if (this._config.args) {
        if (Array.isArray(this._config.args)) {
            for (var i = 0; i < this._config.args.length; i++) {
                var arg = this._config.args[i];

                if (!this._config.returnStdout && (arg.indexOf('--verbose') >= 0 || arg.indexOf('-V') >= 0)) {
                    throw new Error('Cannot override the --verbose or -V argument unless returnStdout=true.');
                }
                if (arg.indexOf('-c') >= 0 || arg.indexOf('--const') >= 0) {
                    throw new Error('Cannot override --const or -c argument. Use \'constants\' config property instead.');
                }
                if (arg.indexOf('-n') >= 0 || arg.indexOf('--number') >= 0) {
                    throw new Error('Cannot override --number or -n argument. Use \'maxModels\' config property instead.');
                }
            }
        } else {
            throw new Error('Config \'args\' property must be an Array.');
        }
    }
};

Clingo.prototype.solve = function(options) {
    // Merge options with the base config
    var config = mergeConfigs(this._config, options);
    this.validateConfig();

    // Convert object of form {var1: val1, var2: val2} to ['-c var1=val1', '-c var2=val2']
    var constArray = [];
    if (config.constants) {
        for (var varName in config.constants) {
            constArray.push('-c ' + varName + '=' + config.constants[varName])
        }
    }

    // Set arguments for the clingo process
    var args = new Array();
    args.push(config.maxModels != undefined ? config.maxModels : 1);
    // Output only the answer sets, unless user wants to handle stdout
    if (!config.returnStdout) args.push('--verbose=0');
    if (constArray.length > 0) args = args.concat(constArray);
    args = args.concat(config.args ? config.args : [],
        config.inputFiles ? config.inputFiles : []);
    if (config.input) args.push('-');

    // Start the process
    var clingo = spawn(config.clingo, args);

    var returnedObject = {};

    // If the user wants us to manage the stdout
    if (!config.returnStdout) {
        var eventHandlers = {
            'model': new Array(),
            'end': new Array()
        };
        returnedObject.on = function(event, handler) {
            eventHandlers[event] ? eventHandlers[event].push(handler) : 0;

            return returnedObject;
        };

        clingo.stdout.setEncoding('utf8');
        var outputBuffer = '';
        clingo.stdout.on('data', function(data) {
            data = outputBuffer + data;
            var models = data.split('\n');

            for (var i = 0; i < models.length - 1; i++) {
                if (models[i] !== 'UNSATISFIABLE'
                        && models[i] !== 'SATISFIABLE'
                        && models[i] !== 'UNKNOWN') {
                    var model = models[i].split(' ');

                    // Notify registered handlers
                    for(var j = 0; j < eventHandlers.model.length; j++) {
                        eventHandlers.model[j](model);
                    }
                }
                outputBuffer = '';
            }
            outputBuffer += models[models.length - 1];
        });
        clingo.stdout.on('end', function() {
            // Notify registered handlers
            for(var i = 0; i < eventHandlers.end.length; i++) {
                eventHandlers.end[i]();
            }
        });
    } else {
        returnedObject.stdout = clingo.stdout;
    }

    if (config.input) {
        if (Array.isArray(config.input)) {
            var stringToSend = config.input.toString().replace(',', '.');
            stringToSend = stringToSend === '' ? '' : stringToSend + '.';

            clingo.stdin.write(stringToSend);
        } else if (typeof config.input === 'string') {
            clingo.stdin.write(config.input);
        } else if (config.input instanceof Readable) {
            config.input.pipe(clingo.stdin, {end: false});
        } else {
            clingo.stdin.write(config.input.toString());
        }
    }

    if (config.returnStdin) {
        // Include the process stdin if the config says so
        returnedObject.stdin = clingo.stdin;
    } else {
        // Otherwise close it so the process will end
        clingo.stdin.end();
    }

    return returnedObject;
};

module.exports = Clingo;