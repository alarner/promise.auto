module.exports = function(promiseWrappers, options) {
	let pw = Object.assign({}, promiseWrappers);
	options = Object.assign({
		stopOnError: false,
		debug: false
	}, options);
	let results = {};
	let errors = {};
	let count = {
		success: 0,
		error: 0,
		running: 0
	};

	return new Promise((resolve, reject) => {
		function then(key) {
			return function(result) {
				results[key] = result;
				count.success++;
				count.running--;
				run();
			};
		}

		function error(key) {
			return function(error) {
				errors[key] = error;
				count.error++;
				count.running--;
				run();
			};
		}

		function run() {
			if(count.error && options.stopOnError) {
				return reject(errors);
			}
			for(let key in pw) {
				let runnable = true;
				let deps = pw[key].dependencies || [];
				for(let i=0; i<deps.length; i++) {
					let dep = deps[i];
					if(!results.hasOwnProperty(dep)) {
						runnable = false;
						break;
					}
				}
				if(runnable) {
					count.running++;
					new Promise((resolve, reject) => {
						pw[key].promise(resolve, reject, results)
					})
					.then(then(key))
					.catch(error(key));

					delete pw[key];
				}

				if(count.error && options.debug) {
					for(let i=0; i<deps.length; i++) {
						let dep = deps[i];
						if(!errors.hasOwnProperty(dep)) {
							console.warn(`${key} will not run because of failed dependency ${dep}`);
						}
					}
				}
			}
			if(count.running === 0) {
				if(options.debug && Object.keys(pw).length) {
					console.warn(`The following promises didn't run because of unmet dependencies: ${Object.keys(pw).join()}`);
				}
				resolve({
					results,
					errors
				});
			}
		}
		run();
	});
};