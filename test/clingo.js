var Clingo = require('../clingo');

exports.shouldInitializeConfig = function(test) {
	var clingo = new Clingo();

    test.expect(1);
    test.ok(clingo.config(), "Clingo config was not initialized properly.");
    test.done();
};

exports.shouldSetConfig = function(test) {
	var clingo = new Clingo();

    test.expect(1);

    var newConfig = {someProperty: true};
    clingo.setConfig(newConfig);
    test.deepEqual(clingo.config(), newConfig, "Setting config did not work.");
    test.done();
};

exports.shouldMergeConfigsWhenConfigIsCalledOnInitializedConfig = function(test) {
	var clingo = new Clingo();

    test.expect(1);

    var newConfig = {someProperty: true};
    clingo.setConfig(newConfig);
    clingo.config({someProperty: 0, someNewProperty: 1})
    test.deepEqual(clingo.config(), {someProperty: 0, someNewProperty: 1}, "Resulting config did not properly merge config objects.");
    test.done();
};

exports.shouldNotValidateIfConfigIsNotSet = function(test) {
	var clingo = new Clingo();
	clingo._config = undefined;

	test.throws(function () {
		clingo.validateConfig();
	}, /undefined/i);

	test.done();
}

exports.shouldNotValidateIfConfigClingoValueIsNotAString = function(test) {
	var clingo = new Clingo();
	clingo.config({clingo: {}});

	test.throws(function () {
		clingo.validateConfig();
	}, /clingo.*string/i);

	test.done();
}

exports.shouldNotValidateIfConfigMaxModelsIsSetToANonNumber = function(test) {
	var clingo = new Clingo();
	clingo.config({maxModels: {}});

	test.throws(function () {
		clingo.validateConfig();
	}, /maxModels.*number/i);

	test.done();
}

exports.shouldNotValidateIfConfigArgsIsSetToNonArray = function(test) {
	var clingo = new Clingo();
	clingo.config({args: {}});

	test.throws(function () {
		clingo.validateConfig();
	}, /args.*Array/i);

	test.done();
}

exports.shouldNotValidateIfVerboseArgumentOverriddenAndReturnStdoutNotTrue = function(test) {
	var clingo = new Clingo();

	var errRegX = /verbose.*returnStdout/i

	clingo.config({args: ['-V'], returnStdout:false});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);


	clingo.config({args: ['--verbose'], returnStdout:false});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);

	test.done();
}

exports.shouldNotValidateIfConfigConstantArgumentOverridden = function(test) {
	var clingo = new Clingo();

	var errRegX = /--const.*constants/i

	clingo.config({args: ['-c']});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);


	clingo.config({args: ['--const']});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);

	test.done();
}

exports.shouldNotValidateIfConfigMaxModelsArgumentOverridden = function(test) {
	var clingo = new Clingo();

	var errRegX = /--number.*maxModels/i

	clingo.config({args: ['-n']});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);


	clingo.config({args: ['--number']});
	test.throws(function () {
		clingo.validateConfig();
	}, errRegX);

	test.done();
}

var zeroModelsInput = 
	'test. not test.';

var threeModelsInput = 
	'test(0) | test(1) | test(2).';

var constantsInput = 
	'test(from..to).';

exports.ClingoDependentTests = {
	shouldReceiveCorrectModels: function(test) {
		var clingo = new Clingo();
		test.expect(3);

		clingo.solve({
			inputFiles: '-',
			maxModels: 0,
			input: threeModelsInput
		})
		.on('model', function(answer) {
			test.ok(threeModelsInput.indexOf(answer[0]) >= 0);
		})
		.on('end', function() {
			test.done();
		});
	},
	shouldSendModelsToMultipleHandlers: function(test) {
		var clingo = new Clingo();
		test.expect(6);

		clingo.solve({
			inputFiles: '-',
			maxModels: 0,
			input: threeModelsInput
		})
		.on('model', function(answer) {
			test.ok(true);
		})
		.on('model', function(answer) {
			test.ok(true);
		})
		.on('end', function() {
			test.done();
		});
	},
	shouldDefaultMaxModelsTo1: function(test) {
		var clingo = new Clingo();
		test.expect(1);

		clingo.solve({
			inputFiles: '-',
			maxModels: undefined,
			input: threeModelsInput
		})
		.on('model', function(answer) {
			test.ok(true);
		})
		.on('end', function() {
			test.done();
		});
	},
	shouldObeyMaxModels: function(test) {
		var clingo = new Clingo();
		test.expect(2);

		clingo.solve({
			inputFiles: '-',
			maxModels: 2,
			input: threeModelsInput
		})
		.on('model', function(answer) {
			test.ok(true);
		})
		.on('end', function() {
			test.done();
		});
	},
	shouldHandleConfigConstants: function(test) {
		var clingo = new Clingo();
		test.expect(1);

		clingo.solve({
			inputFiles: '-',
			maxModels: 0,
			constants: {from:0, to:9},
			input: constantsInput
		})
		.on('model', function(answer) {
			test.ok(answer.length === 10);
		})
		.on('end', function() {
			test.done();
		});
	},
	shouldProperlyPassAlongStdoutIfSpecified: function(test) {
		var clingo = new Clingo();
		test.expect(3);

		var ps = clingo.solve({
			inputFiles: '-',
			maxModels: 0,
			args: ['--verbose=0'],
			returnStdout: true,
			input: zeroModelsInput
		});

		test.ok(!ps.on, 'Returned object should not have \'on\' property if returnStdout is set.');
		test.ok(ps.stdout, 'Returned object should include stdout when returnStdout is set.');

		var allData = '';
		ps.stdout.setEncoding('utf8');
		ps.stdout.on('data', function(data) {
			allData += data;
		});
		ps.stdout.on('end', function() {
			allData = allData.trim();
			test.ok(allData === 'UNSATISFIABLE', 'Returned stdout did not have expected output.');
			test.done();
		});
	},
	shouldProperlyPassAlongStdinIfSpecified: function(test) {
		var clingo = new Clingo();
		test.expect(4);

		var ps = clingo.solve({
			inputFiles: '-',
			maxModels: 0,
			returnStdin: true
		});

		test.ok(ps.stdin, 'Returned object should include stdin when returnStdin is set.');
		ps.stdin.end(threeModelsInput);

		ps.on('model', function(model) {
			test.ok(true);
		})
		.on('end', function() {
			test.done();
		});
	}
}

