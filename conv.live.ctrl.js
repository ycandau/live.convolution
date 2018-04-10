// ========  INLETS AND OUTLETS  =========

inlets  = 1;
outlets = 8;

var outl =
{
  routing:     0,
  leds:        1,
  gate:        2,
  values:      3,
  dict:        4,
  menu:        5,
  id:          6,
  thispatcher: 7
};

// ========  GLOBAL VARIABLES  ========

var debug = false;

var ctrl_cnt = 30;
var active_ct = -1;
var routing_arr = [];
routing_arr.length = ctrl_cnt;

var dict = new Dict("ConvDict");
var ctrl_key = "Controllers";

// ========  IO MENU  ========

var name_cur = "";    // the current name of the state, received from "umenu" object
var name_new = "";    // the new name of the sate, received from "text" object
var cmd_cur = "";    // the current command
var cmd_ind = -1;    // the index of the current command, from cmd_arr

var ctrl_name = "";

// Interface information: which data entry objects are used by which commands
// the order in relation to the menu does not matter as long as it is consistent in the script

var cmd_arr = ["default", "save", "load", "rename", "delete", "post"];
var cmd_cnt = 6;
var umenu_use = [1, 0, 1, 1, 1, 0];
var text_use =  [0, 1, 0, 1, 0, 0];

var def_ctrl = "Nano";

// ====  INIT  ====
function init()
{
  //outlet(outl.routing, "all", -1);      // reset the routing references
  //outlet(outl.values, "all", 0);      // reset the midi values
  //outlet(outl.leds, "all", "set", 0);  // reset the leds

  for (var ct = 1; ct <= ctrl_cnt; ct++) {
    update_id(ct, -1);
    outlet(outl.values, ct, "set", 0);
    outlet(outl.leds, ct, "set", 0); }

  active_ct = -1;
  ctrl_name = "";
  name_cur = "";
  name_new = "";
  reset_menu();

  outlet(outl.menu, "current", "clear");
  outlet(outl.menu, "menu", "symbol", "load");

  outlet(outl.thispatcher, "window", "flags", "nomenu");
  outlet(outl.thispatcher, "window", "flags", "nozoom");
  outlet(outl.thispatcher, "window", "flags", "nominimize");
  outlet(outl.thispatcher, "window", "flags", "close");
  outlet(outl.thispatcher, "window", "flags", "nogrow");
  outlet(outl.thispatcher, "window", "flags", "float");
  outlet(outl.thispatcher, "window", "size", 575, 175, 1130, 595);
  outlet(outl.thispatcher, "window", "exec");

  load_m(dict.get("DefCtrl"));
}

function edit()
{
  outlet(outl.thispatcher, "window", "flags", "menu");
  outlet(outl.thispatcher, "window", "flags", "zoom");
  outlet(outl.thispatcher, "window", "flags", "minimize");
  outlet(outl.thispatcher, "window", "flags", "close");
  outlet(outl.thispatcher, "window", "flags", "grow");
  outlet(outl.thispatcher, "window", "flags", "nofloat");
  outlet(outl.thispatcher, "window", "size", 575, 175, 1400, 800);
  outlet(outl.thispatcher, "window", "exec");
}

function config(on_off)   // @TODO Should now happen on window closure
{
  outlet(outl.gate, on_off);
  outlet(outl.leds, "all", "ignoreclick", 1 - on_off);
  outlet(outl.leds, active_ct, "set", 0);
  active_ct = -1;
}

// ====  LEDS  ====
// Message from an led to set it active
function leds(ct, val)
{
  if (val === 1) {
    outlet(outl.leds, active_ct, "set", 0);
    active_ct = ct; }

  else {
    active_ct = -1; }
}

function update_id(ct, id)
{
  routing_arr[ct - 1] = id;
  outlet(outl.routing, ct, id);
  outlet(outl.id, ct, id);
}

// ====  MIDI  ====
// Receive a midi message to link a midi reference to a controller
function midi(id, value)
{
  if (active_ct !== -1) { update_id(active_ct, id); }
}

function clear()
{
  if (active_ct !== -1) { update_id(active_ct, -1); }

}

// ====  NEXT  ====
// Iterate the detection through the controls
function next()
{
  outlet(outl.leds, active_ct, "set", 0);

  switch (active_ct) {
  case -1: active_ct = 1; break;
  case 5: active_ct = 11; break;
  case 30: active_ct = 1; break;
  default: active_ct++; }

  outlet(outl.leds, active_ct, "set", 1);
}

// ====  ESCAPE  ====
// End the detection
function escape()
{
  if (active_ct !== -1) {
    outlet(outl.leds, active_ct, "set", 0);
    active_ct = -1; }
}

// ==== MENU ====
// Do this when a command is received
function menu(cmd)
{
  switch (cmd) {
  case "post": post_m(); break;
  default: break; }

  // If the command has not changed don't do anything
  if (cmd === cmd_cur) { return; }
  else { cmd_cur = cmd; }

  // Set the command index
  cmd_ind = 0;
  while ((cmd_arr[cmd_ind] !== cmd) && (cmd_ind !== cmd_cnt)) { cmd_ind++; }
  if (cmd_ind === cmd_cnt) { cmd_ind = -1; }

  // Reset the data entry objects and variables
  reset_menu();
  cmd_is_ready();

  // Lock and unlock the data entry objects
  outlet(outl.menu, "umenu", "ignoreclick", !umenu_use[cmd_ind]);
  outlet(outl.menu, "umenu_h", "hidden", umenu_use[cmd_ind]);

  outlet(outl.menu, "textedit", "ignoreclick", !text_use[cmd_ind]);
  outlet(outl.menu, "textedit_h", "hidden", text_use[cmd_ind]);
}

function umenu(name)
{
	if (name === " ") { name_cur = ""; }
  else { name_cur = name; }
  cmd_is_ready();
}

function text(name)
{
  if (name === undefined) { name_new = ""; }
  else { name_new = name; }
  cmd_is_ready();
}

function confirm()
{
  switch (cmd_cur){
	case "save": save_m(name_new); break;
	case "load": load_m(name_cur); break;
  case "rename":  rename_m(name_cur, name_new); break;
	case "delete":  delete_m(name_cur); break;
  case "default":  default_m(name_cur); break;
	default: return;	}
}

function has_name_cur() { return (name_cur !== ""); }
function has_name_new() { return (name_new !== "") && (name_new !== undefined); }

function set_confirm(on_off)
{
  outlet(outl.menu, "confirm", "text", on_off ? "confirm" : " ");
  outlet(outl.menu, "confirm", "ignoreclick", !on_off);
}

function cmd_is_ready()
{
  if ((cmd_cur === "init") || (cmd_cur === "post")) { set_confirm(0); }
  else if ((has_name_cur() || !umenu_use[cmd_ind])
      && (has_name_new() || !text_use[cmd_ind])) { set_confirm(1); }
  else { set_confirm(0); }
}

// ==== reset_menu ====
// Update the list of names in the umenu object
function set_umenu()
{
  // Clear the menu and append an empty option
  outlet(outl.menu, "umenu", "clear");
  outlet(outl.menu, "umenu", "append", " ");

  // Append all the file or set names from the dictionary
  var keys = dict.get(ctrl_key).getkeys();

  // Necessary to distinguish: empty, one, more than one
  if (keys === null) { }
  else if (typeof keys === "string") { outlet(outl.menu, "umenu", "append", keys); }
  else {
    for (var k = 0, len = keys.length; k < len; k++) {
      outlet(outl.menu, "umenu", "append", keys[k]); } }

  outlet(outl.menu, "umenu", "setsymbol", " ");
}

function reset_menu()
{
	name_cur = "";
	name_new = "";
  set_umenu();
  set_confirm(0);

  if (cmd_cur === "save") {
    name_new = ctrl_name;
    outlet(outl.menu, "textedit", "set", name_new); }

  else {
    name_cur = "";
    outlet(outl.menu, "textedit", "clear"); }
}

function save_m(name)
{
  dict.replace(ctrl_key + "::" + name, routing_arr);
  ctrl_name = name;
  outlet(outl.menu, "current", "set", name);
  reset_menu();
}

function load_m(name)
{
  routing_arr = dict.get(ctrl_key + "::" + name);
  for (var ct = 1; ct <= ctrl_cnt; ct++) {
    outlet(outl.routing, ct, routing_arr[ct - 1]);
    outlet(outl.id, ct, routing_arr[ct - 1]); }
  ctrl_name = name;
  outlet(outl.menu, "current", "set", name);
}

// ====  RENAME  ====
function rename_m(name_cur_a, name_new_a)
{
  var arr_tmp = dict.get(ctrl_key + "::" + name_cur_a);
  dict.remove(ctrl_key + "::" + name_cur_a);
  dict.replace(ctrl_key + "::" + name_new_a, arr_tmp);
  reset_menu();
}

function delete_m(name)
{
  dict.remove(ctrl_key + "::" + name);
  reset_menu();
}

function default_m(name)
{
  dict.replace("DefCtrl", name);
}

function post_m()
{
  post("Current setting:  Controller:  "
    + (ctrl_name !== "" ? name_cur : "Not named yet. Save it first.") + "\n");

  var name_arr = ["master", "source", "in1", "in2", "xfade", "", "", "", "", "",
    "conv1", "conv2", "conv3", "conv4", "conv5", "conv6", "conv7", "conv8", "conv9", "conv10",
    "buff1", "buff2", "buff3", "buff4", "buff5", "buff6", "buff7", "buff8", "buff9", "buff10"];

  for (var ct = 1; ct <= ctrl_cnt; ct++) {
    if (name_arr[ct - 1] !== "") {
      post("  " + name_arr[ct - 1] + ":  ");
      if (routing_arr[ct - 1] !== -1) {
        post("Chan: " + (routing_arr[ct - 1] / 128)
          + "  -  Ctrl: " + (routing_arr[ct - 1] % 128)
          + "  -  Id: " + routing_arr[ct - 1] + "\n"); }
      else { post("UNDEF\n"); } } }
}
