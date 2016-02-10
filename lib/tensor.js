var globals = require("./globals");

var gl = globals.gl;

function Tensor(shape, data){
	if(shape.length != 2)
		throw new Error("Only Tensor of order two (matrix) is supported right now.");

	var M = shape[0],
		N = shape[1];

	this.texture = gl.createDataTexture(M, N, data);

	this.shape = [M, N];
}

module.exports = Tensor;

Tensor.prototype.delete = function(){
	gl.context.deleteTexture(this.texture);
	this.texture = null;
	this.shape = null;
};

Tensor.prototype.transfer = function(keep){

	var M = this.shape[0],
		N = this.shape[1],
		out,
		result;

	// create output texture
	out = gl.createOutputTexture(M, N);

	// float extraction
	gl.encode(M, N, this.texture, out);

	result = new Float32Array(gl.readData(M, N));

	// clean up
	gl.context.deleteTexture(out);

	if(!keep){
		this.delete();
	}

	return result;
};

Tensor.prototype.reshape = function(shape, keep){

	var M = this.shape[0],
		N = this.shape[1],
		M_out = shape[0],
		N_out = shape[1];

	// create new texture to hold tranpose
	var t0 = new Tensor(shape, null);

	// invoke shader
	gl.reshape(M, N, M_out, N_out, this.texture, t0.texture);

	if(!keep){
		this.delete();
	}

	return t0;
};

Tensor.prototype.transpose = function(keep){

	var M = this.shape[0],
		N = this.shape[1];

	// create new texture to hold tranpose
	var tT = new Tensor([N, M], null);

	// invoke shader
	gl.transpose(M, N, this.texture, tT.texture);

	if(!keep){
		this.delete();
	}

	return tT;
};

Tensor.prototype.split = function(keep){

	var M = this.shape[0],
		N = this.shape[1];

	if(N % 2 !== 0)
		throw new Error("row count must be multiple of two.");


	// create new texture to hold tranpose
	var t0 = new Tensor([M, N/2], null),
		t1 = new Tensor([M, N/2], null);

	gl.submatrix(N, M, N/2, 0, this.texture, t0.texture);
	gl.submatrix(N, M, N/2, N/2, this.texture, t1.texture);

	if(!keep){
		this.delete();
	}

	return [t0, t1];
}

Tensor.combine = function(t0, t1, keep){

	var M = t0.shape[0],
		N = t0.shape[1];

	if(t0.shape[1] !== t1.shape[1] || t0.shape[0] !== t1.shape[0])
		throw new Error("row and column counts must be equal.");


	// create new texture to hold tranpose
	var t2 = new Tensor([M, N * 2], null);

	gl.combine(M, N, t0.texture, t1.texture, t2.texture);

	if(!keep){
		t0.delete();
		t1.delete();
	}

	return t2;
}