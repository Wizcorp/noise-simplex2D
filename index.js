var RandomNumberGenerator = require('math-random').RandomNumberGenerator;

/**
 * @classdesc 2-dimensional Simplex Noise
 * @class
 *
 * @author Brice Chevalier
 *
 * @param {object} params
 * @param {number} params.octaves
 * @param {number} params.amplitude
 * @param {number} params.frequency
 * @param {number} params.persistance
 * @param {number} params.base
 */

var grad = [
	[1, 1],
	[-1, 1],
	[1, -1],
	[-1, -1],
	[1, 0],
	[-1, 0],
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[0, 1],
	[0, -1],
	[1, 1],
	[-1, 1],
	[1, -1],
	[-1, -1]
];


function Simplex2D(params) {
	params = params || {};
	this.octaves = !params.octaves ? 1 : params.octaves;
	this.amplitude = !params.amplitude ? 1 : params.amplitude;
	this.frequency = !params.frequency ? 1 : params.frequency;
	this.persistance = !params.persistance ? 0.5 : Math.min(Math.max(params.persistance, 0), 1);

	// The scale is used to put the noise value in the interval [-amplitude / 2; amplitude / 2]
	this.scale = (this.persistance === 1) ? this.octaves * this.amplitude / 2 : (1 - this.persistance) / (1 - Math.pow(this.persistance, this.octaves)) * this.amplitude / 2;

	// The base is used to put the noise value in the interval [base; amplitude + base]
	this.base = (params.base || 0) + this.amplitude / 2;

	// initialize the permutation table
	this.seed(params.seed || 0);
}

/** Initialize noise's permutation table with provided seed
 *
 * @param {Number} seedNumber
 */
Simplex2D.prototype.seed = function (seedNumber) {
	var i;

	// reset permutation table
	var perm = this.perm = [];
	for (i = 0; i < 256; i++) perm.push(i);

	// randomly permute elements in table
	var random = new RandomNumberGenerator(seedNumber);
	for (i = 0; i < 256; i++) {
		var index = ~~(256 * random.next());
		// permute the two indexes
		var v = perm[i];
		perm[i] = perm[index];
		perm[index] = v;
	}

	// concat the table with itself to duplicate the permutations
	perm = perm.concat(perm);
};


var f2 = 0.5 * (Math.sqrt(3.0) - 1.0);
var g2 = (3.0 - Math.sqrt(3.0)) / 6.0;
Simplex2D.prototype.generateNoise = function (xin, yin) {
	var perm = this.perm;

	var n0, n1, n2; // Noise contributions from the three corners

	// Skew the input space to determine which simplex cell we're in
	var s = (xin + yin) * f2; // Hairy factor for 2D
	var i = Math.floor(xin + s);
	var j = Math.floor(yin + s);
	var t = (i + j) * g2;

	var x0 = i - t; // Unskew the cell origin back to (x,y) space
	var y0 = j - t;
	x0 = xin - x0; // The x,y distances from the cell origin
	y0 = yin - y0;

	// For the 2D case, the simplex shape is an equilateral triangle.
	// Determine which simplex we are in.
	var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
	if (x0 > y0) {
		i1 = 1;
		j1 = 0; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
	} else {
		i1 = 0;
		j1 = 1; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
	}

	// A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
	// a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
	// c = (3-sqrt(3))/6
	var x1 = x0 - i1 + g2; // Offsets for middle corner in (x,y) unskewed coords
	var y1 = y0 - j1 + g2;
	var x2 = x0 - 1.0 + 2.0 * g2; // Offsets for last corner in (x,y) unskewed coords
	var y2 = y0 - 1.0 + 2.0 * g2;

	// Work out the hashed gradient indices of the three simplex corners
	var ii = i & 255;
	var jj = j & 255;

	// Calculate the contribution from the three corners
	var t0 = 0.5 - x0 * x0 - y0 * y0;
	var t1 = 0.5 - x1 * x1 - y1 * y1;
	var t2 = 0.5 - x2 * x2 - y2 * y2;

	if (t0 < 0) {
		n0 = 0.0;
	} else {
		var gi0 = perm[ii + perm[jj]] & 15;
		t0 *= t0;
		n0 = t0 * t0 * (grad[gi0][0] * x0 + grad[gi0][1] * y0); // (x,y) of grad3 used for 2D gradient
	}

	if (t1 < 0) {
		n1 = 0.0;
	} else {
		var gi1 = perm[ii + i1 + perm[jj + j1]] & 15;
		t1 *= t1;
		n1 = t1 * t1 * (grad[gi1][0] * x1 + grad[gi1][1] * y1);
	}

	if (t2 < 0) {
		n2 = 0.0;
	} else {
		var gi2 = perm[ii + 1 + perm[jj + 1]] & 15;
		t2 *= t2;
		n2 = t2 * t2 * (grad[gi2][0] * x2 + grad[gi2][1] * y2);
	}

	// Add contributions from each corner to get the final noise value.
	// The result is scaled to return values in the interval [-1,1].
	return 70.0 * (n0 + n1 + n2);
};

// Complexity in O(o)
// with o the number of octaves
Simplex2D.prototype.getNoise = function (x, y) {
	var noise = 0;
	var amp = 1.0;

	for (var o = 0; o < this.octaves; o += 1) {
		noise += this.generateNoise(x, y) * amp;
		x *= this.frequency;
		y *= this.frequency;
		amp *= this.persistance;
	}

	return noise * this.scale + this.base;
};

module.exports = Simplex2D;