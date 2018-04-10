// ========  INLETS AND OUTLETS  =========

inlets = 1;
outlets = 17;

// Object used for the outlet indexes
var outl =
{
  menu:      0,   // all the menu objects
  buffer:    1,   // buffer~ objects
  waveform:  2,   // waveform~ objects
  multiconv: 3,   // live multi convolution object
  buffconv:  4,   // buffer convolution object
  irtrim:    5,   // buffer IR trimming object
  button:    6,   // button objects for signalling
  buff_eq:   7,   // buffer equalization object
  info:      8,   // info~ object
  channels:  9,   // Chan subpatches
  gains:     10,  // gain display objects
  filesys:   11,  // y.filesys object for file management
  filename:  12,  // textedit objects for filename display
  returns:   13,  // initialize join objects for invalid returns
  js:        14,  // to itself
  ctrl:      15,
  pcontrol:  16
};

// ========  SCRIPT BEHAVIOUR  ========

var debug = true;

// ========  MENU  ========

var channel_cur = 0;  // the current index, from umenu
var name_cur = "";    // the current name of the file or set. from umenu
var name_new = "";    // the new name of the file or set, from textedit
var cmd_cur = "";     // the current command
var cmd_ind = 0;      // the index of the current command, from cmd_arr

var has_typed = false;

var dict_conv = new Dict("ConvDict");

// Interface information: which data entry objects are used by which commands
// the order must be consistent in the script, but not with the patch menu
var cmd_cnt = 10;
var cmd_split = 5;    // constant to distinguish between file and set commands
var cmd_arr = ["normalize_f", "save_f", "load_f", "rename_f", "delete_f",
  "normalize_s", "save_s", "load_s", "rename_s", "delete_s"];
var index_use = [1, 1, 1, 0, 0, 1, 1, 1, 0, 0];
var umenu_use = [0, 0, 1, 1, 1, 0, 0, 1, 1, 1];
var text_use =  [0, 1, 0, 1, 0, 0, 1, 0, 1, 0];

var quad_arr = [1, 2, 4, 3, 1, 2, 4, 3, 4, 3];
var quad_coord = [[0, 100], [100, 100], [100, 0], [0, 0]];

// ========  OTHER  ========

var files_dir = "";
var sets_dir = "";
var file_key = "Files";
var set_key = "Sets";

var ch_cnt = 10;
var bit_depth = "int24";
var samplerate = 44100;
var format = "int24";

var format_arr = ["int8", "int16", "int24", "int32", "float32", "float64", "mulaw", "alaw"];

var buff_null;

var channels = [];
var ACT = 0;
var INACT = 1;
var EQ = 0;
var CONV = 1;

var trim_in = -30;
var trim_out = -45;
var fade_in = 1;
var fade_out = 1;

var xfade_time = 2000;

// ========  INITIALIZATION AND RESET  ========

function Channel(ch)
{
  this.ch = ch;
  this.active = 1;
  this.A = 2 * this.ch;
  this.I = 2 * this.ch - 1;

  this.locked = false;

  this.buff_name = [];
  this.buff_name.length = 2;
  this.buff_name[0] =  "conv_" + (2 * ch - 1);
  this.buff_name[1] =  "conv_" + (2 * ch);

  this.buffer = [];
  this.buffer.length = 2;
  this.buffer[0] = new Buffer(this.buff_name[0]);
  this.buffer[1] = new Buffer(this.buff_name[1]);
  _reset_buffer(this.buffer[0]);
  _reset_buffer(this.buffer[1]);

  this.gain_auto = [];
  this.gain_auto.length = 2;
  this.gain_auto[0] = 0.0;
  this.gain_auto[1] = 0.0;

  this.gain_manu = [];
  this.gain_manu.length = 2;
  this.gain_manu[0] = 0.0;
  this.gain_manu[1] = 0.0;

  this.file_name = [];
  this.file_name.length = 2;
  this.file_name[0] = "";
  this.file_name[1] = "";

  this.was_EQed = false;

  outlet(outl.channels, ch, "index", ch);   // set indexes in Peak patches
  outlet(outl.channels, ch, "line", this.active);   // init lines in Peak patches
  outlet(outl.multiconv, "set", 1, this.A, "conv_null");
  outlet(outl.multiconv, "set", 1, this.I, "conv_null");
  outlet(outl.waveform, ch, "set", this.buff_name[this.active]);
  outlet(outl.filename, ch, "clear");
  outlet(outl.channels, ch, "sig0", 0.0);
  outlet(outl.channels, ch, "sig1", 0.0);
  outlet(outl.channels, ch, "groove0", "set", this.buff_name[0]);
  outlet(outl.channels, ch, "groove1", "set", this.buff_name[1]);
  outlet(outl.channels, ch, "groove0", "reset");
  outlet(outl.channels, ch, "groove1", "reset");
  outlet(outl.channels, ch, "groove0", "loop", 1);
  outlet(outl.channels, ch, "groove1", "loop", 1);
  outlet(outl.channels, ch, "groove0", "loopinterp", 1);
  outlet(outl.channels, ch, "groove1", "loopinterp", 1);
  outlet(outl.gains, "quad", ch, quad_coord[quad_arr[ch - 1] - 1]);

  this.bname = function(a) {
    return (this.buff_name[a ? 1 - this.active : this.active]); };
  this.buff = function(a) {
    return (this.buffer[a ? 1 - this.active : this.active]); };

  this.g_auto = function(a) {
    return (this.gain_auto[a ? 1 - this.active : this.active]); };
  this.g_manu = function(a) {
    return (this.gain_manu[a ? 1 - this.active : this.active]); };
  this.fname = function(a) {
    return (this.file_name[a ? 1 - this.active : this.active]); };

  this.set_fname = function(a, n) {
    this.file_name[a ? 1 - this.active : this.active] = n;
    if (a === ACT) { outlet(outl.filename, this.ch, "set", fname_from_path(n).split(" ")); } };

  this.upd_gain_auto = function(b, g) {   // From Chan patcher
    this.gain_auto[b] = g;                // array
    if (b === this.active) { outlet(outl.gains, "auto", this.ch, "set", g); } };  // display

  this.set_gain = function(a, g) {   // From JS
    var b = a ? 1 - this.active : this.active;
    this.upd_gain_auto(b, g);
    outlet(outl.channels, this.ch, "auto" + b, "set", g);  // auto patches
    this.upd_gain_manu(a, 0);
    if (a === ACT) { outlet(outl.gains, "manual", this.ch, "set", 0); } };   // display

  this.upd_gain_manu = function(a, g) {   // From dial in patcher
    this.gain_manu[a ? 1 - this.active : this.active] = g;   // array
    outlet(outl.channels, this.ch, "manual" + (a ? 1 - this.active : this.active), g); };  // expression

  // Display the gains
  this.disp_gains = function(a) {
    outlet(outl.gains, "auto", this.ch, "set", this.gain_auto[a ? 1 - this.active : this.active]);
    outlet(outl.gains, "manual", this.ch, "set", this.gain_manu[a ? 1 - this.active : this.active]); };
  this.disp_gains(ACT);

  // Store the active gains in the dictionary
  this.g_to_dict = function(name) {
    this.set_gain(ACT, this.gain_auto[this.active] + this.gain_manu[this.active]);
    dict_conv.replace(file_key + "::" + name + "::gain", this.gain_auto[this.active]);
    this.bang(); };

  // Store the active gains in the dictionary
  this.g_to_dict_s = function(name) {
    this.set_gain(ACT, this.gain_auto[this.active] + this.gain_manu[this.active]);
    dict_conv.append(set_key + "::" + name + "::gains", this.gain_auto[this.active]);
    this.bang(); };

  // Retrieve the inactive gains from the dictionary
  this.g_from_dict_s = function(ind, name, fname) {
    this.set_gain(INACT, dict_conv.get(set_key + "::" + name + "::gains[" + (ind - 1) + "]"));
    this.set_fname(INACT, fname); };

  // Clear a buffer
  this.clear = function(a) {
    _reset_buffer(this.buffer[a ? 1 - this.active : this.active]);
    this.gain_auto[a ? 1 - this.active : this.active] = 0.0;
    this.gain_manu[a ? 1 - this.active : this.active] = 0.0;
    this.file_name[a ? 1 - this.active : this.active] = ""; };

  // Set the channel's button on and off
  this.button = function(on_off) {
    outlet(outl.button, this.ch, on_off * 100, 10); };
  this.button(0);

  // Bang the channel's button
  this.bang = function () {
    this.button(1);
    var task = new Task(this.button, this, 0);
    task.schedule(200); };

  // Bang the channel's button
  this.button_cntd = function (time) {
    outlet(outl.button, this.ch, 100, time); };

  this.is_empty = function(a, cmd) {
    if (this.file_name[a ? 1 - this.active : this.active] === "") {
      post("WARNING:  " + cmd + ":  The channel is empty.\n"); return true; }
    else { return false; } };

  this.error = function(cmd) {
    post("ERROR:  " + cmd + " [" + this.ch + "]:  Invalid return.\n");
    _reset_menu();
    this.unlock(); };

  this.cmd_begin = function(cmd) {

    // Test for empty channels
    switch(cmd) {
    case "load_f": case "undo": case "clear": default: break;

    case "eq": if (this.is_empty(ACT, cmd)) { return true; } break;

    case "conv_prev":
      if (channels[this.ch - 2].is_empty(ACT, cmd)
        || channels[0].is_empty(ACT, cmd)) { return true; } break;

    case "conv_self":
      if (this.is_empty(ACT, cmd)
        || channels[0].is_empty(ACT, cmd)) { return true; } break; }

    // Test if the channel is already locked
    if (this.locked === true) {
      if (cmd !== "clear") {
        post("WARNING:  " + cmd + ":  The channel is locked.\n"); return true; }
      else { post("WARNING:  clear:  Overriding locked channel.\n"); } }

    // Lock the channel, toggle EQ tracking, and return with no errors
    this.locked = true;
    if (cmd !== "eq") { this.was_EQed = false; }
    return false; };

  this.cmd_return = function(cmd, name) {

    // Normalize the buffer
    switch (cmd) {
    case "undo": case "clear": break;
    case "load_f": case "eq": case "conv_prev": case "conv_self":
      this.buff(INACT).send("normalize", 1.0); break;
    default: break; }

    // Update the file name
    switch (cmd) {
    case "load_f": this.set_fname(INACT, name); break;
    case "eq": this.set_fname(INACT, fname_proc(EQ, this.fname(ACT))); break;
    case "conv_prev": this.set_fname(INACT, fname_proc(CONV, channels[this.ch - 2].fname(ACT))); break;
    case "conv_self": this.set_fname(INACT, fname_proc(CONV, this.fname(ACT))); break;
    default: break; }

    // Update the gains
    switch (cmd) {
    case "load_f":
      if (dict_conv.contains(file_key + "::" + name)) {
        this.set_gain(INACT, dict_conv.get(file_key + "::" + name + "::gain")); }
      else { this.set_gain(INACT, 0); }
      break;
    case "eq":
      this.set_gain(INACT, this.g_auto(ACT) + this.g_manu(ACT));
      break;
    case "conv_prev":
      this.set_gain(INACT,
        Math.min(channels[0].g_auto(ACT) + channels[0].g_manu(ACT),
        channels[this.ch - 2].g_auto(ACT) + channels[this.ch - 2].g_manu(ACT)));
      break;
    case "conv_self":
      this.set_gain(INACT,
        Math.min(channels[0].g_auto(ACT) + channels[0].g_manu(ACT),
        this.g_auto(ACT) + this.g_manu(ACT)));
      break;
    default: break; }
   };

  this.xfade_beg = function(time) {
    this.button_cntd(time);
    this.active = 1 - this.active;
    this.A = (this.active === 0) ? 2 * this.ch - 1 : 2 * this.ch;
    this.I = (this.active === 1) ? 2 * this.ch - 1 : 2 * this.ch;
    outlet(outl.channels, this.ch, "groove" + this.active, 0);
    this.disp_gains(ACT);
    outlet(outl.filename, this.ch, "set",
      this.file_name[this.active].replace(/\.\w*$/, "").split(" "));
    outlet(outl.waveform, this.ch, "set", this.bname(ACT));
    outlet(outl.multiconv, "set", 1, this.A, this.bname(ACT)); };

  this.xfade_end = function() {
    outlet(outl.channels, this.ch, "groove" + (1 - this.active), "stop");
    outlet(outl.multiconv, "set", 1, this.I, "conv_null");
    this.locked = false;
    this.button(0); };

  this.unlock = function() { this.locked = false; };

  this.post = function() {

    post("  " + this.ch + "-" + 1
      + ":  Length: " + this.buffer[0].length().toFixed(1)
      + " - Channels: " + this.buffer[0].channelcount()
      + " - File: " + ( this.file_name[0] === "" ? "empty" : this.file_name[0] )
      + (this.active === 0 ? " - Active" : "") + "\n");

    post("  " + this.ch + "-" + 2
      + ":  Length: " + this.buffer[1].length().toFixed(1)
      + " - Channels: " + this.buffer[1].channelcount()
      + " - File: " + ( this.file_name[1] === "" ? "empty" : this.file_name[1] )
      + (this.active === 1 ? " - Active" : "") + "\n"); };
}

function _reset_buffer(buff)
{
  // Reset the buffer
  buff.send("samps", 16);
  buff.send("fill", 0.0);
  buff.send("sr", samplerate);
  buff.send("format", format);
}

function fname_from_path(str) { return str.replace(/\.\w*$/, ""); }
function fname_s(set_ind, name) { return (name + "_" + set_ind + ".aif"); }
function fullname_s(set_ind, name) { return (sets_dir + name + "_" + set_ind + ".aif"); }
function shortname_s(str) { return str.replace(/_[1-5]\.\w*$/, ""); }
function fname_clean(str) { return str.trim().replace(/ [ ]*/g, " "); }

function fname_proc(type, str)
{
  var sub = str;

  var CV_n = sub.match(/^CV\d+_[^.]/);
  if (CV_n === null) { CV_n = 0; }
  else {
    var len = CV_n.toString().length;
    sub = sub.substring(len - 1);
    CV_n = Number(CV_n.toString().substring(2, len - 2)); }

  var EQ_n = sub.match(/^EQ\d+_[^.]/);
  if (EQ_n === null) { EQ_n = 0; }
  else {
    len = EQ_n.toString().length;
    sub = sub.substring(len - 1);
    EQ_n = Number(EQ_n.toString().substring(2, len - 2)); }

  if (type === CONV) { CV_n++; }
  else if (type === EQ) { EQ_n++; }

  return (CV_n ? "CV" + CV_n + "_" : "") + (EQ_n ? "EQ"  + EQ_n + "_" : "") + sub;
}

function init()
{
  if (debug) { post("TRACE:  init ( )\n"); }

  // Set the js objects to watch for their file's changes
  outlet(outl.js, "autowatch", 1);

  // Initialize the join objects to detect invalid returns
  outlet(outl.returns, "_invalid_return");

  // Get the path of the main patcher file
  var patcher_dir = this.patcher.parentpatcher.filepath;
  patcher_dir = patcher_dir.replace(/[^//]*$/, "");
  files_dir = patcher_dir + file_key + "/";
  sets_dir = patcher_dir + set_key + "/";

  // Setup the null buffer
  buff_null = new Buffer("conv_null");
  _reset_buffer(buff_null);

  // Setup the array of channels
  channels.length = ch_cnt;
  for (var ch = 1; ch <= ch_cnt; ch++) { channels[ch - 1] = new Channel(ch); }

  // Set the waveform selections
  outlet(outl.waveform, "sel_beg", "all", 0.0);
  outlet(outl.waveform, "sel_end", "all", 0.0);

  // Set the irtrimnorm~ object to limited warnings
  outlet(outl.irtrim, "limitedwarnings", 1);

  // Initialize the menu
  cmd_cur = "";   // so the following command will register a change
  outlet(outl.menu, "live.tab", "symbol", "load");

  outlet(outl.gains, "quad", 0, 50, 50);

  // Init the controller patch
  outlet(outl.ctrl, "autowatch", 1);
  outlet(outl.ctrl, "init");

  post("Live convolution patch initialized.\n");
}

// ========  MENU SET FUNCTIONS  ========

/**
  Reset the menu.
  Used every time the command is changed.
*/
function _reset_menu()
{
  channel_cur = 1;
	name_cur = "";
	name_new = "";
  has_typed = false;
  _set_channel();
  _set_umenu();
  _set_confirm(0);
}

function _set_channel()
{
  // Clear the menu and append an empty option
  outlet(outl.menu, "index", "clear");

  if (cmd_ind < cmd_split) {
    for (var ch = 1; ch <= ch_cnt; ch++) {
      outlet(outl.menu, "index", "append", ch); } }

  else {
    outlet(outl.menu, "index", "append", "1");
    outlet(outl.menu, "index", "append", "2"); }

  outlet(outl.menu, "index", "symbol", 1);
}

function _set_umenu()
{
  // Clear the menu and append an empty option
  outlet(outl.menu, "umenu", "clear");
  outlet(outl.menu, "umenu", "append", " ");

  // Append all the file or set names from the dictionary
  var key = (cmd_ind < cmd_split) ? file_key : set_key;
  var keys = dict_conv.get(key).getkeys();

  // Necessary to distinguish: empty, one, more than one
  if (keys === null) { }
  else if (typeof keys === "string") { outlet(outl.menu, "umenu", "append", keys); }
  else {
    for (var k = 0, len = keys.length; k < len; k++) {
      outlet(outl.menu, "umenu", "append", keys[k]); } }

  outlet(outl.menu, "umenu", "setsymbol", " ");
}

/**
  Set the option to confirm on or off.
*/
function _set_confirm(on_off)
{
  outlet(outl.menu, "confirm", "text", on_off ? "confirm" : " ");
  outlet(outl.menu, "confirm", "ignoreclick", !on_off);
  outlet(outl.menu, "confirm2", on_off);
}

// ========  MENU HAS FUNCTIONS  ========

function _has_index() { return (channel_cur !== 0); }
function _has_name_cur() { return (name_cur !== ""); }
function _has_name_new() { return (name_new !== "") && (name_new !== undefined); }

/**
  Test if the current command is ready to be confirmed.
*/
function _cmd_is_ready()
{
  if ((_has_index() || !index_use[cmd_ind])
      && (_has_name_cur() || !umenu_use[cmd_ind])
      && (_has_name_new() || !text_use[cmd_ind])) {
    _set_confirm(1); }

  else { _set_confirm(0); }
}

/**
  Receive a command from the menu object,
  and forward corresponding messages to the
*/
function menu(cmd)
{
  // In all other cases exit if the command has not changed
  if (cmd === cmd_cur) { return; }
  else { cmd_cur = cmd; }

	// Get the command index
	cmd_ind = 0;
	while ((cmd_arr[cmd_ind] !== cmd) && (cmd_ind !== cmd_cnt)) { cmd_ind++; }
	if (cmd_ind === cmd_cnt) { cmd_ind = -1; }

	// Reset the data entry objects and variables
	_reset_menu();

	// Lock and unlock the data entry objects
	outlet(outl.menu, "index", "ignoreclick", !index_use[cmd_ind]);
	outlet(outl.menu, "index_h", "hidden", index_use[cmd_ind]);

  outlet(outl.menu, "umenu", "ignoreclick", !umenu_use[cmd_ind]);
	outlet(outl.menu, "umenu_h", "hidden", umenu_use[cmd_ind]);

	outlet(outl.menu, "textedit", "ignoreclick", !text_use[cmd_ind]);
	outlet(outl.menu, "textedit_h", "hidden", text_use[cmd_ind]);

  // Test if the command already has all the information it needs
  _cmd_is_ready();
}

/**
  Receive the channel from the channel umenu.
*/
function channel(ch)
{
  var CH = channels[ch - 1];

  // Assign to the current index, including for an empty choice
  if (ch === " ") { channel_cur = 0; }
  else { channel_cur = ch; }

  // For safe_f and if nothing has been typed in the textedit object
  // has_typed is also reset when the new name text is deleted
  if ((cmd_cur === "save_f") && (!has_typed)) {

    // If there is an index and a grain name stored
    if ((channel_cur !== 0) && (CH.fname(ACT) !== "")) {
      post("IN ", CH.fname(ACT), CH.fname(ACT).split(" "));
      name_new = CH.fname(ACT);
      outlet(outl.menu, "textedit", "set", CH.fname(ACT).split(" ")); }

    // ... otherwise clear the textedit object
    else {
      name_new = "";
      outlet(outl.menu, "textedit", "clear"); } }

  // Check if the command is ready to be confirmed
  _cmd_is_ready();
}

/**
  Receive the current name from the choice in the umenu object.
*/
function umenu(name)
{
	if (name === " ") { name_cur = ""; }
  else { name_cur = name; }
  _cmd_is_ready();
}

/**
  Receive the new name from the content of the text object.
*/
function textedit(name)
{
  // Assign to the new name, including when undefined
  if (name === undefined) { name_new = ""; }
  else { name_new = fname_clean(name); }

  // Update the textedit object after formatting
  outlet(outl.menu, "textedit", "set", name_new.split(" "));

  // Update has_typed, reset when the new name text is deleted
  if (name_new === "") { has_typed = false; }
  else  { has_typed = true; }

  _cmd_is_ready();
}

/**
  Receive a grain name from the dropfile objects.
  Forward a message to a source buffer, then caught by the buffer () function.

  @param ch The index of the channel (1 to ch_cnt).
  @param full_name The full name and path of the audio file.
*/
function dropfile(ch, full_name)
{
  if (debug) { post("TRACE:  file ( index = " + ch + ", file = "
    + full_name + " )\n"); }

  _load_f(1, ch, full_name, ch);
}

/**
  Confirm the current command.
  The corresponding message is sent to the main JS script.
*/
function confirm()
{
  switch (cmd_cur){

  case "normalize_f":  _adjust_f(channel_cur); break;
	case "save_f": _save_f(0, channel_cur, name_new, 0); break;
	case "load_f": _load_f(0, channel_cur, name_cur, 0); break;
  case "rename_f":  _rename_f(0, name_cur, name_new, 1); break;
	case "delete_f":  _delete_f(0, name_cur, 1); break;

  case "normalize_s":  _adjust_s(channel_cur); break;
  case "save_s": _save_s(0, channel_cur, name_new, 0); break;
  case "load_s": _load_s(0, channel_cur, name_cur, 0); break;
  case "rename_s":  _rename_s(0, name_cur, name_new, 1); break;
  case "delete_s":  _delete_s(0, name_cur, 1); break;
	default: return;	}
}

function _adjust_f(ch)
{
  var CH = channels[ch - 1];
  if (CH.is_empty(ACT, "adjust")) { return; }

  var err_str = "";
  if (!dict_conv.contains(file_key + "::" + CH.fname(ACT))) { err_str = "Not in dictionary"; }
  if (CH.fname(ACT) === "") { err_str = "Channel empty"; }

  if (err_str !== "") {
    post("WARNING:  adjust:  " + err_str + ". Unable to adjust. Save the channel first.\n");
    return; }

  CH.g_to_dict(CH.fname(ACT));   // update and store gains
}

function _save_f(iter, ch, name, ind_ret)
{
  var CH = channels[ch - 1];
  if (CH.is_empty(ACT, "save")) { return; }

  switch (iter) {

  case 0:   // ==== From menu confirmation: send message to active buffer
    outlet(outl.buffer, 3, CH.A, "writeaiff", files_dir + name, "_save_f", 1, ch, name);
    return;

  case 1:   // ==== Return from active buffer on completion
    if (CH.A !== ind_ret) { CH.error("save_f"); return; }

    CH.set_fname(ACT, name);
    CH.g_to_dict(name);   // update and store gains
    post("Grain " + ch + " saved.\n");
    break;

  default: CH.error("save_f"); return; }
}

function _load_f(iter, ch, name, ind_ret)
{
  if (debug) { post("TRACE:  _load_f ( iter = " + iter + ", ch = "
    + ch + ", name = " + name + ", ind_ret = " + ind_ret + " )\n"); }

  var CH = channels[ch - 1];

  switch (iter) {

  case 0:   // ==== From menu confirmation: name is just the name of the file
    if (CH.cmd_begin("load_f")) { return; }

    // Send replace message to inactive buffer
    outlet(outl.buffer, 3, CH.I, "replace", files_dir + name, "_load_f", 2, ch, name);
    return;

  case 1:   // ==== From dropfile object: name is the full path of the file
    if (CH.cmd_begin("load_f")) { return; }

    var name_form = name.replace(/.*\//, ""); // extract file name from path
    name_form = fname_clean(name_form);      // format file name

    // Send replace message to inactive buffer
    outlet(outl.buffer, 3, CH.I, "replace", name, "_load_f", 2, ch, name_form);
    return;

  case 2:   // ==== Return from buffer object on completion
    // Test index matching
    if (CH.I !== ind_ret) { CH.error("load_f"); return; }

    // Normalize and set name, then crossfade
    CH.cmd_return("load_f", name);
    _xfade(0, ch, ch);
    break;

  default: CH.error("load_f"); return; }
}

function _rename_f(iter, name_cur_a, name_new_a, file_ret)
{
  switch (iter) {

  case 0:   // ==== From menu confirmation: send message to filesys object
    outlet(outl.filesys, 3, "rename", file_key + "/" + name_cur_a,
      file_key + "/" + name_new_a, "_rename_f", iter + 1, name_cur_a, name_new_a);
    return;

  case 1:   // ==== Return from filesys object on completion

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  rename_f:  Rename failed.\n"); _reset_menu(); return; }

    // Rename the key in the dictionary, and reset the menu
    var dict_tmp = new Dict();
    dict_tmp.clone(dict_conv.get(file_key).get(name_cur_a).name);
    dict_conv.remove(file_key + "::" + name_cur_a);
    dict_conv.replace(file_key + "::" + name_new_a, dict_tmp);
    _reset_menu();
    break;

  default: post("ERROR:  rename_f:  Invalid return.\n"); _reset_menu(); return; }
}

function _delete_f(iter, name, file_ret)
{
  switch (iter) {

  case 0:   // ==== From menu confirmation: send message to filesys object
    outlet(outl.filesys, 2, "delete", file_key + "/" + name,
      "_delete_f", iter + 1, name);
    return;

  case 1:   // ==== Return from filesys object on completion

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  delete_f:  Delete failed.\n"); _reset_menu(); return; }

    // Delete the key in the dictionary, and reset the menu
    dict_conv.remove(file_key + "::" + name);
    _reset_menu();
    break;

  default: post("ERROR:  delete_f:  Invalid return.\n"); _reset_menu(); return; }
}

function _adjust_s(set_ind)
{
  var ch_first = (set_ind - 1) * 5 + 1;
  var name = channels[ch_first - 1].fname(ACT);
  name = shortname_s(name);

  // Test the names of the files to ensure they are all from the same set
  var err_str = "";
  for (var ch = ch_first + 1; ch < ch_first + ch_cnt / 2; ch++) {
    if (name !== shortname_s(channels[ch - 1].fname(ACT))) {
      err_str = "Files mismatched"; } }

  // Test that the dictionary already contains the key
  if (!dict_conv.contains(set_key + "::" + name)) { err_str = "Not in dictionary"; }

  if (err_str !== "") {
    post("WARNING:  adjust set:  " + err_str + ". Unable to adjust set. Save it first.\n");
    return; }

  // Clear the array in the dictionary
  dict_conv.remove(set_key + "::" + name + "::gains");

  // Update the gains
  for (ch = ch_first; ch < ch_first + ch_cnt / 2; ch++) {
    channels[ch - 1].g_to_dict_s(name); }
}

function _save_s(iter, set_ind, name, ind_ret)
{
  if (debug) { post("TRACE:  _save_s ( iter = " + iter + ", set_ind = "
    + set_ind + ", name = " + name + ", ind_ret = " + ind_ret + " )\n"); }

  // The iteration should be from 0 to 5
  correct:
  if ((iter >= 0) && (iter <= 5)) {

    // First iteration:
    if (iter === 0) {

      // Reset the array of gains stored in the dictionary
      if (dict_conv.contains(set_key + "::" + name + "::gains")) {
        dict_conv.remove(set_key + "::" + name + "::gains"); } }

    // Iteration: 1 to 5 - Receive a return from a buffer
    if (iter > 0) {

      var CH = channels[iter + (set_ind - 1) * 5 - 1];

      // The return message should be from a buffer with the same index
      if (CH.A !== ind_ret) { break correct; }

      CH.set_fname(ACT, fname_s(iter, name));
      CH.g_to_dict_s(name); }

    // Iteration: 0 to 4 - Send message to active buffer and exit
    if (iter < 5) {

      outlet(outl.buffer, 3,
        channels[iter + (set_ind - 1) * 5].A, "writeaiff", fullname_s(iter + 1, name),
        "_save_s", iter + 1, set_ind, name);
      return; }

    // Last iteration: 5
    else {
      post("Set " + set_ind + " saved.\n");  // post a message
      return; } }

  CH.error("save_s");
}

function _load_s(iter, set_ind, name, ind_ret)
{
  if (debug) { post("TRACE:  _load_s ( iter = " + iter + ", set_ind = "
    + set_ind + ", name = " + name + ", ind_ret = " + ind_ret + " )\n"); }

  var first = (set_ind - 1) * 5;
  if ((iter === 0) && (channels[first].locked
    || channels[first + 1].locked || channels[first + 2].locked
    || channels[first + 3].locked || channels[first + 4].locked)) {
      post("WARNING:  load set:  One of the channels is locked.\n"); return; }
    else { this.locked = true; }

  // The iteration should be from 0 to 5
  correct:
  if ((iter >= 0) && (iter <= 5)) {

    // Iteration: 1 to 5 - Receive a return from a buffer
    if (iter > 0) {

      var CH = channels[iter + first - 1];

      // The return message should be from a buffer with the same index
      if (CH.I !== ind_ret) { break correct; }

      // Normalize, set name and crossfade
      CH.cmd_return("load_s");
      CH.was_EQed = false;
      CH.g_from_dict_s(iter, name, fname_s(iter, name));
      _xfade(0, CH.ch, CH.ch); }

    // Iteration: 0 to 4 - Send a message to a buffer and exit
    if (iter < 5) {

      outlet(outl.buffer, 3, channels[iter + first].I,
        "replace", fullname_s(iter + 1, name),
        "_load_s", iter + 1, set_ind, name);
      return; }

    // Last iteration: 5
    else { return; } }

  CH.error("load_s");
  channels[first].unlock(); channels[first + 1].unlock();
  channels[first + 2].unlock(); channels[first + 3].unlock();
  channels[first + 4].unlock();
}

function _rename_s(iter, name_cur_a, name_new_a, file_ret)
{
  switch (iter) {

  // From confirm then filesys object
  case 0: case 1: case 2: case 3: case 4:

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  rename_s:   Rename failed.\n"); _reset_menu(); return; }

    // Send a rename message to y.filesys
    outlet(outl.filesys, 3,
      "rename", fullname_s(iter + 1, name_cur_a),
        fullname_s(iter + 1, name_new_a),
      "_rename_s", iter + 1, name_cur_a, name_new_a);
    return;

  // Last return from EQ buffers
  case 5:

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  rename_s:  Rename failed.\n"); _reset_menu(); return; }

    // Rename the key in the dictionary, and reset the menu
    var dict_tmp = new Dict();
    dict_tmp.clone(dict_conv.get(set_key).get(name_cur_a).name);
    dict_conv.remove(set_key + "::" + name_cur_a);
    dict_conv.replace(set_key + "::" + name_new_a, dict_tmp);
    _reset_menu();
    break;

  default: post("ERROR:  rename_s:  Invalid return.\n"); _reset_menu(); return; }
}

function _delete_s(iter, name, file_ret)
{
  switch (iter) {

  // From confirm then filesys object
  case 0: case 1: case 2: case 3: case 4:

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  delete_s:   Delete failed.\n"); _reset_menu(); return; }

    // Send a delete message to y.filesys
    outlet(outl.filesys, 2, "delete", fullname_s(iter + 1, name),
      "_delete_s", iter + 1, name);
    break;

  case 5:   // ==== Last return from y.filesys ====

    // Test the return message from y.filesys
    if (!file_ret) { post("ERROR:  delete_s:  Delete failed.\n"); _reset_menu(); return; }

    // Delete the key in the dictionary, and reset the menu
    dict_conv.remove(set_key + "::" + name);
    _reset_menu();
    break;

  default: post("ERROR:  delete_s:  Invalid return.\n"); _reset_menu(); return; }
}

/**
  Load a grain into the multiconvolve~ object.
*/
function _xfade(iter, ch, ch_ret)
{
  if (debug) { post("TRACE:  _xfade ( iter = " + iter + ", ch = "
    + ch + ", ch_ret = " + ch_ret + " )\n"); }

  var CH = channels[ch - 1];

  switch (iter) {

  case -1: CH.xfade_beg(100);    // From clear function

    // Send message to line object in ./Audio/Peak/Mix
    outlet(outl.channels, ch, "mix", 2, CH.active, 100, "_xfade", 1, ch);
    return;

  case 0: CH.xfade_beg(xfade_time);

    // Send message to line object in ./Audio/Peak/Mix
    outlet(outl.channels, ch, "mix", 2, CH.active, xfade_time, "_xfade", 1, ch);
    return;

  case 1: CH.xfade_end(); break;

  default: CH.error("xfade"); return; }
}

// ====  TRIM_EACH  ====
// Trim each grain separately

function trim_each()
{
  //outlet(outl.irtrim, "trimto", _name_act(ind), _name_act(ind), trim_in,
  //  trim_out, fade_in, fade_out);
}

// ====  TRIM_ALL  ====
// Trim all the grains together

function trim_all()
{
  if (debug) { post("TRACE:  trim_all ( )\n"); }

  /*outlet(outl.irtrim, "trimto", buff_names, buff_names, trim_in, trim_out,
    fade_in, fade_out);   @TODO */
}

// ====  IRTRIMNORM  ====
// Received from irtrimnorm~ object

function irtrimnorm()
{

}

// ====  INFO  ====
// Post information on the buffers and files

function info()
{
  post("Buffers:\n");
  for (var ch = 1; ch <= ch_cnt; ch++) { channels[ch - 1].post(); }

  post("Gains:\n  Active - Auto:  ");
  for (ch = 1; ch <= ch_cnt; ch++) { post(channels[ch - 1].g_auto(ACT)); }
  post("\n  Active - Manual:  ");
  for (ch = 1; ch <= ch_cnt; ch++) { post(channels[ch - 1].g_manu(ACT)); }

  post("\n  Inactive - Auto:  ");
  for (ch = 1; ch <= ch_cnt; ch++) { post(channels[ch - 1].g_auto(INACT)); }
  post("\n  Inactive - Manual:  ");
  for (ch = 1; ch <= ch_cnt; ch++) { post(channels[ch - 1].g_manu(INACT)); }
  post("\n");
}

/**
  Restore a buffer from its source
*/
function undo(ch)
{
  var CH = channels[ch - 1];
  if (CH.cmd_begin("undo")) { return; }
  _xfade(0, ch, ch);
}

function clear(ch)
{
  var CH = channels[ch - 1];
  if (CH.cmd_begin("clear")) { return; }
  CH.clear(INACT);
  _xfade(-1, ch, ch);   // -1 sets xfade for clear
}

// ====  EQ  ====
// Apply EQ filtering to a buffer

function eq(iter, ch)
{
  if (debug) { post("TRACE:  eq ( iter = " + iter + ", ch = " + ch + " )\n"); }

  var CH = channels[ch - 1];

  switch(iter) {

  case 0:
    if (CH.cmd_begin("eq")) { return; }

    // Copy the inactive buffer to the active buffer and switch the names
    if (CH.was_EQed) {
      CH.buff(ACT).send("duplicate", CH.bname(INACT));
      CH.set_fname(ACT, CH.fname(INACT)); }
    else {
      CH.buff(INACT).send("duplicate", CH.bname(ACT));    // or vice versa
      CH.was_EQed = true; }

    // Send a message to the buff.filter~ object
    outlet(outl.buff_eq, 2, "eq", CH.bname(INACT), "eq", 1, ch);
    break;

  case 1:
    CH.cmd_return("eq");
    _xfade(0, ch, ch);
    break;

  default: CH.error("eq"); return; }
}

function conv_prev(iter, ch)
{
  if (debug) { post("TRACE:  conv_prev ( iter = " + iter + ", ch = " + ch + " )\n"); }

  var CH = channels[ch - 1];

  switch(iter) {

  case 0:
    if (ch === 1) { return; }   // can't convolve first channel with previous
    if (CH.cmd_begin("conv_prev")) { return; }

    // Send convolve message to buffconvolve
    outlet(outl.buffconv, 4,
      "convolve", CH.bname(INACT), channels[ch - 2].bname(ACT), channels[0].bname(ACT),
      "conv_prev", 1, ch);
    return;

  case 1:
    CH.cmd_return("conv_prev");
    _xfade(0, ch, ch);
    return;

  default: CH.error("conv_prev"); return; }
}

function conv_self(iter, ch)
{
  if (debug) { post("TRACE:  conv_self ( iter = " + iter + ", ch = " + ch + " )\n"); }

  var CH = channels[ch - 1];

  switch(iter) {

  case 0:
    if (CH.cmd_begin("conv_self")) { return; }

    // Send convolve message to buffconvolve
    outlet(outl.buffconv, 4,
      "convolve", CH.bname(INACT), CH.bname(ACT), channels[0].bname(ACT),
      "conv_self", 1, ch);
    return;

  case 1:
    CH.cmd_return("conv_self");
    _xfade(0, ch, ch);
    return;

  default: CH.error("conv_self"); return; }
}

/**
  Receive automatic gains in db from the Peak patches.
  @param ch The index of the channel, from 0 to ch_cnt.
  @param gain_a The corresponding gain.
*/
function gain_auto(ch, branch, gain)
{
  channels[ch - 1].upd_gain_auto(branch, gain);
}

/**
  Receive manual gains in db from the Peak patches.
  @param ch The index of the channel, from 0 to ch_cnt.
  @param gain_a The corresponding gain.
*/
function gain_manual(ch, gain)
{
  channels[ch - 1].upd_gain_manu(ACT, gain);
}

function xfade(time)
{
  xfade_time = time;
}

function auto(type, act, ch)
{

  outlet(outl.channels, ch, "auto"
    + (act === "act" ? channels[ch - 1].active : 1 - channels[ch - 1].active), type);
}

/**
  Receive update from dspstate object when dsp is turned on or off.
*/
function dspstate(sr, vect_sig, vect_io)
{
  if (debug) { post("TRACE:  dspstate ( samplerate = " + sr
    + ", vect_sig_a = " + vect_sig + ", vect_io_a = " + vect_io + " )\n"); }

  // Post a warning if the signal vectors are too short
  if ((vect_sig <= 4) || (vect_io <= 4)) {
    post("WARNING:  Short vectors:  I/O vector = " + vect_io
      + "  -  Signal vector = " + vect_sig + "\n"); }

  samplerate = sr;
}

/**
  Catch invalid returns from objects sending information back.
*/
function _invalid_return()
{
  post("ERROR:  Invalid return.\n");
}

/**
  Catch invalid list messages to the script.
*/
function list()
{
  post("ERROR:  Invalid list sent to the script. Could be an incorrect return.\n");
  var args = arrayfromargs(arguments);
  post("  ", args, "\n");
}

/**
  Catch invalid bangs to the script.
*/
function bang()
{
  post("ERROR:  Invalid bang sent to the script.\n");
}

/**
  Catch any other invalid message to the script.
*/
function anything()
{
  post("ERROR:  Invalid message sent to the script. Could be an incorrect return.\n");
  var args = arrayfromargs(messagename, arguments);
  post("  ", args, "\n");
}
