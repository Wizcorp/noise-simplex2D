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

// Permutation table
var perm = [
	182, 235, 131, 26, 88, 132, 100, 117, 202, 176, 10, 19, 83, 243, 75, 52,
	252, 194, 32, 30, 72, 15, 124, 53, 236, 183, 121, 103, 175, 39, 253, 120,
	166, 33, 237, 141, 99, 180, 18, 143, 69, 136, 173, 21, 210, 189, 16, 142,
	190, 130, 109, 186, 104, 80, 62, 51, 165, 25, 122, 119, 42, 219, 146, 61,
	149, 177, 54, 158, 27, 170, 60, 201, 159, 193, 203, 58, 154, 222, 78, 138,
	220, 41, 98, 14, 156, 31, 29, 246, 81, 181, 40, 161, 192, 227, 35, 241,
	135, 150, 89, 68, 134, 114, 230, 123, 187, 179, 67, 217, 71, 218, 7, 148,
	228, 251, 93, 8, 140, 125, 73, 37, 82, 28, 112, 24, 174, 118, 232, 137,
	191, 133, 147, 245, 6, 172, 95, 113, 185, 205, 254, 116, 55, 198, 57, 152,
	128, 233, 74, 225, 34, 223, 79, 111, 215, 85, 200, 9, 242, 12, 167, 44,
	20, 110, 107, 126, 86, 231, 234, 76, 207, 102, 214, 238, 221, 145, 213, 64,
	197, 38, 168, 157, 87, 92, 255, 212, 49, 196, 240, 90, 63, 0, 77, 94,
	1, 108, 91, 17, 224, 188, 153, 250, 249, 199, 127, 59, 46, 184, 36, 43,
	209, 206, 248, 4, 56, 47, 226, 13, 144, 22, 11, 247, 70, 244, 48, 97,
	151, 195, 96, 101, 45, 66, 239, 178, 171, 160, 84, 65, 23, 3, 211, 162,
	163, 50, 105, 129, 155, 169, 115, 5, 106, 2, 208, 204, 139, 229, 164, 216,
	182, 235, 131, 26, 88, 132, 100, 117, 202, 176, 10, 19, 83, 243, 75, 52,
	252, 194, 32, 30, 72, 15, 124, 53, 236, 183, 121, 103, 175, 39, 253, 120,
	166, 33, 237, 141, 99, 180, 18, 143, 69, 136, 173, 21, 210, 189, 16, 142,
	190, 130, 109, 186, 104, 80, 62, 51, 165, 25, 122, 119, 42, 219, 146, 61,
	149, 177, 54, 158, 27, 170, 60, 201, 159, 193, 203, 58, 154, 222, 78, 138,
	220, 41, 98, 14, 156, 31, 29, 246, 81, 181, 40, 161, 192, 227, 35, 241,
	135, 150, 89, 68, 134, 114, 230, 123, 187, 179, 67, 217, 71, 218, 7, 148,
	228, 251, 93, 8, 140, 125, 73, 37, 82, 28, 112, 24, 174, 118, 232, 137,
	191, 133, 147, 245, 6, 172, 95, 113, 185, 205, 254, 116, 55, 198, 57, 152,
	128, 233, 74, 225, 34, 223, 79, 111, 215, 85, 200, 9, 242, 12, 167, 44,
	20, 110, 107, 126, 86, 231, 234, 76, 207, 102, 214, 238, 221, 145, 213, 64,
	197, 38, 168, 157, 87, 92, 255, 212, 49, 196, 240, 90, 63, 0, 77, 94,
	1, 108, 91, 17, 224, 188, 153, 250, 249, 199, 127, 59, 46, 184, 36, 43,
	209, 206, 248, 4, 56, 47, 226, 13, 144, 22, 11, 247, 70, 244, 48, 97,
	151, 195, 96, 101, 45, 66, 239, 178, 171, 160, 84, 65, 23, 3, 211, 162,
	163, 50, 105, 129, 155, 169, 115, 5, 106, 2, 208, 204, 139, 229, 164, 216
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
}

var f2 = 0.5 * (Math.sqrt(3.0) - 1.0);
var g2 = (3.0 - Math.sqrt(3.0)) / 6.0;
Simplex2D.prototype.generateNoise = function (xin, yin) {
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