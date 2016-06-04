let expect = require('chai').expect;
let auto = require('../src/index.js');
describe('promise.auto', function() {
	it('should exist', function() {
		expect(auto).to.not.be.undefined;
	});

	it('should work with one simple promise that has no dependencies', function(done) {
		auto({
			return_five: {
				promise: (resolve, reject) => {
					resolve(5);
				}
			}
		})
		.then(data => {
			expect(data.results.return_five).to.equal(5);
			done();
		})
		.catch(err => {
			console.log(err);
		});
	});

	it('should work with one simple promise that has no dependencies but takes 200ms', function(done) {
		auto({
			return_five: {
				promise: (resolve, reject) => {
					setTimeout(() => { resolve(5); }, 200);
				}
			}
		})
		.then(data => {
			expect(data.results.return_five).to.equal(5);
			done();
		})
		.catch(err => {
			console.log(err);
		});
	});

	it('should work with two simple promises that has no dependencies but take 200ms each', function(done) {
		let now = Date.now();
		auto({
			return_five: {
				promise: (resolve, reject) => {
					setTimeout(() => { resolve(5); }, 200);
				}
			},
			return_six: {
				promise: (resolve, reject) => {
					setTimeout(() => { resolve(6); }, 200);
				}
			}
		})
		.then(data => {
			let time = Date.now() - now;
			expect(time, 'runs in parallel').to.be.lessThan(250);
			expect(data.results.return_five).to.equal(5);
			expect(data.results.return_six).to.equal(6);
			done();
		})
		.catch(err => {
			console.log(err);
		});
	});

	it('should work with two simple promises in series and take 200ms each', function(done) {
		let now = Date.now();
		auto({
			return_five: {
				promise: (resolve, reject) => {
					setTimeout(() => {
						resolve(5);
					}, 200);
				}
			},
			return_six: {
				dependencies: ['return_five'],
				promise: (resolve, reject) => {
					setTimeout(() => {
						resolve(6);
					}, 200);
				}
			}
		})
		.then(data => {
			let time = Date.now() - now;
			expect(time, 'runs in series').to.be.greaterThan(399);
			expect(data.results.return_five).to.equal(5);
			expect(data.results.return_six).to.equal(6);
			done();
		})
		.catch(err => {
			console.log(err);
		});
	});
});