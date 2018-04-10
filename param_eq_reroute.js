// ======== INLETS AND OUTLETS =========

inlets = 1;
outlets = 35;

var zl_group_0 = 30;
var zl_group_1 = 31;
var commands   = 32;
var cascade_OI = 33;
var param_OI   = 34;

var nb = 6;

// ======== GOBAL VARIABLES ========

var filter_cnt = 5;
var bypass = 1;

var is_on_arr = [1, 1, 1, 1, 1];
var index_arr = [0, 1, 2, 3, 4];

var mode_arr = [2, 5, 5, 5, 1];
var freq_arr = [60, 240, 960, 3840, 15360];
var gain_arr = [0, 0, 0, 0, 0];
var q_arr    = [1, 1, 1, 1, 1];

var cascade_arr = [];
var param_arr = [];


// ======== FUNCTIONS ========

function itoname (i)
{
	switch (i) {
	case 1: return "lowpass";
	case 2: return "highpass";
	case 3: return "bandpass";
	case 4: return "bandstop";
	case 5: return "peaknotch";
	case 6: return "lowshelf";
	case 7: return "highshelf";
	case 8: return "resonant";
	case 9: return "allpass";
	default: return "error"; }
}

function dbtoa (db)
{
	return Math.pow(10, db/20);
}

function init ()
{
	for (ind = 0; ind < 5; ind ++) {
		outlet(nb * ind, "set", freq_arr[ind]);
		outlet(nb * ind + 1, "set", gain_arr[ind]);
		outlet(nb * ind + 2, "set", q_arr[ind]);
		outlet(nb * ind + 3, "set", mode_arr[ind] - 1);	}
}

function cascade ()
{
	if (filter_cnt == 0) {
		bypass = 1;
		outlet(cascade_OI, "bypass", bypass);
 		return; }

	else if (bypass == 1) {
		bypass = 0;
		outlet(cascade_OI, "bypass", bypass); }		

	cascade_arr.length = 5 * filter_cnt;
	param_arr.length = 4 * filter_cnt;
	
	for (index = 0; index < filter_cnt; index ++) {
		
		for (j = 0; j < 5; j++) {
			
			// There is a problem with integer arguments
			// cascade does not convert integers to float and gives out an error message instead
			if (arguments[5 * index_arr[index] + j] % 1 != 0) {
				cascade_arr[5 * index + j]   = arguments[5 * index_arr[index] + j]; }
				
			else {
				cascade_arr[5 * index + j]   = arguments[5 * index_arr[index] + j] + 1e-15; } }
		
		param_arr[4 * index] = itoname(mode_arr[index_arr[index]]);
		param_arr[4 * index + 1] = freq_arr[index_arr[index]];
		param_arr[4 * index + 2] = gain_arr[index_arr[index]];
		param_arr[4 * index + 3] = q_arr[index_arr[index]];
	}
	
	outlet(cascade_OI, cascade_arr);
	outlet(param_OI, param_arr);
}

function toggle (index, state)
{
	// If the filter is off flatten the corresponding curve in the filtergraph
	if (state == 0) {
		outlet(commands, "mode", index, 5);
		outlet(commands, "flat", index);
		outlet(commands, "mode", index, 0); }
		
	// Otherwise restore the curve	
	else {
		outlet(commands, "mode", index, mode_arr[index]);
		outlet(commands, "params", index, freq_arr[index], dbtoa(gain_arr[index]), q_arr[index]); }
	
	// Update the on/off array
	is_on_arr[index] = state;
	
	// Update the filter count and the index array
	filter_cnt = 0;
	for (ind = 0; ind < 5; ind ++) {
		if (is_on_arr[ind] == 1) {
			index_arr[filter_cnt] = ind;
			filter_cnt++; } }
			
	// Update the zl.group objects
	outlet(zl_group_1, filter_cnt);
	outlet(zl_group_0, "zlclear");
	
	// Update the display
	outlet(nb * index, "ignoreclick", 1 - state);
	outlet(nb * index + 1, "ignoreclick", 1 - state);
	outlet(nb * index + 2, "ignoreclick", 1 - state);
	outlet(nb * index + 3, "ignoreclick", 1 - state);
	outlet(nb * index + 4, "hidden", state);
}

function freq ()
{
	for (ind = 0; ind < filter_cnt; ind ++) {
		freq_arr[index_arr[ind]] = arguments[ind];
		outlet(nb * index_arr[ind], "set", arguments[ind]); }
}

function gain ()
{

	for (ind = 0; ind < filter_cnt; ind ++) {
		gain_arr[index_arr[ind]] = arguments[ind];
		outlet(nb * index_arr[ind] + 1, "set", arguments[ind]); }
}

function q ()
{
	for (ind = 0; ind < filter_cnt; ind ++) {
		q_arr[index_arr[ind]] = arguments[ind];
		outlet(nb * index_arr[ind] + 2, "set", arguments[ind]); }
}

function mode (index, mode)
{
	mode_arr[index] = mode;
	outlet(commands, "mode", index, mode_arr[index]);
}

function freq_i (index, freq)
{
	freq_arr[index] = freq;
	outlet(commands, "params", index, freq_arr[index], dbtoa(gain_arr[index]), q_arr[index]);
}

function gain_i (index, gain)
{
	gain_arr[index] = gain;
	outlet(commands, "params", index, freq_arr[index], dbtoa(gain_arr[index]), q_arr[index]);
}

function q_i (index, q)
{
	q_arr[index] = q;
	outlet(commands, "params", index, freq_arr[index], dbtoa(gain_arr[index]), q_arr[index]);
}
