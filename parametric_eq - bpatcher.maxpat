{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 7,
			"minor" : 1,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"rect" : [ 42.0, 85.0, 1115.0, 759.0 ],
		"bgcolor" : [ 0.1, 0.1, 0.1, 1.0 ],
		"editing_bgcolor" : [ 0.1, 0.1, 0.1, 1.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 2,
		"objectsnaponopen" : 0,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "patcher",
		"subpatcher_template" : "myTemplate",
		"boxes" : [ 			{
				"box" : 				{
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-10",
					"lockeddragscroll" : 0,
					"maxclass" : "bpatcher",
					"name" : "parametric_eq.maxpat",
					"numinlets" : 0,
					"numoutlets" : 2,
					"offset" : [ -15.0, -15.0 ],
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 15.0, 15.0, 375.0, 225.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 465.0, 255.0, 375.0, 225.0 ],
					"viewvisibility" : 1
				}

			}
 ],
		"lines" : [  ],
		"parameters" : 		{
			"obj-10::obj-66" : [ "Q[1]", "Q[1]", 0 ],
			"obj-10::obj-9" : [ "Q[3]", "Q[3]", 0 ],
			"obj-10::obj-14" : [ "type[0]", "type[0]", 0 ],
			"obj-10::obj-26" : [ "toggle[4]", "toggle[4]", 0 ],
			"obj-10::obj-10" : [ "gain[3]", "gain[3]", 0 ],
			"obj-10::obj-21" : [ "Q[0]", "Q[0]", 0 ],
			"obj-10::obj-25" : [ "toggle[3]", "toggle[3]", 0 ],
			"obj-10::obj-17" : [ "freq[3]", "freq[3]", 0 ],
			"obj-10::obj-12" : [ "gain[0]", "gain[0]", 0 ],
			"obj-10::obj-20" : [ "toggle[2]", "toggle[2]", 0 ],
			"obj-10::obj-2" : [ "type[2]", "type[2]", 0 ],
			"obj-10::obj-7" : [ "freq[0]", "freq[0]", 0 ],
			"obj-10::obj-3" : [ "Q[2]", "Q[2]", 0 ],
			"obj-10::obj-22" : [ "Q[4]", "Q[4]", 0 ],
			"obj-10::obj-67" : [ "gain[1]", "gain[1]", 0 ],
			"obj-10::obj-23" : [ "gain[4]", "gain[4]", 0 ],
			"obj-10::obj-24" : [ "freq[4]", "freq[4]", 0 ],
			"obj-10::obj-13" : [ "toggle[1]", "toggle[1]", 0 ],
			"obj-10::obj-4" : [ "gain[2]", "gain[2]", 0 ],
			"obj-10::obj-5" : [ "freq[2]", "freq[2]", 0 ],
			"obj-10::obj-65" : [ "type[1]", "type[1]", 0 ],
			"obj-10::obj-8" : [ "type[3]", "type[3]", 0 ],
			"obj-10::obj-107" : [ "toggle[0]", "toggle[0]", 0 ],
			"obj-10::obj-19" : [ "type[4]", "type[4]", 0 ],
			"obj-10::obj-68" : [ "freq[1]", "freq[1]", 0 ]
		}
,
		"dependency_cache" : [ 			{
				"name" : "parametric_eq.maxpat",
				"bootpath" : "C:/03 - Programming/01 - Max/12 - Parametric EQ",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "param_eq_reroute.js",
				"bootpath" : "C:/03 - Programming/01 - Max/12 - Parametric EQ",
				"type" : "TEXT",
				"implicit" : 1
			}
 ],
		"autosave" : 0,
		"styles" : [ 			{
				"name" : "data",
				"default" : 				{
					"accentcolor" : [ 0.8, 0.3, 0.8, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "external",
				"default" : 				{
					"accentcolor" : [ 1.0, 0.0, 0.0, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "js",
				"default" : 				{
					"accentcolor" : [ 1.0, 0.0, 0.0, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "msp",
				"default" : 				{
					"accentcolor" : [ 1.0, 0.8, 0.2, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "patcher",
				"default" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 1.0 ],
					"textcolor_inverse" : [ 1.0, 0.8, 0.2, 1.0 ],
					"patchlinecolor" : [ 0.5, 0.5, 0.5, 0.5 ],
					"textcolor" : [ 1.0, 0.8, 0.2, 1.0 ],
					"accentcolor" : [ 0.5, 0.5, 0.5, 1.0 ],
					"elementcolor" : [ 1.0, 0.8, 0.2, 1.0 ],
					"color" : [ 1.0, 0.0, 0.0, 1.0 ],
					"bgfillcolor" : 					{
						"type" : "color",
						"color1" : [ 0.0, 0.0, 0.0, 1.0 ],
						"color2" : [ 0.3, 0.3, 0.3, 1.0 ],
						"color" : [ 0.0, 0.0, 0.0, 1.0 ],
						"angle" : 270.0,
						"proportion" : 0.39
					}
,
					"clearcolor" : [ 0.2, 0.2, 0.2, 1.0 ],
					"selectioncolor" : [ 1.0, 0.8, 0.2, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "send",
				"default" : 				{
					"accentcolor" : [ 0.0, 0.5, 0.2, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "sub",
				"default" : 				{
					"accentcolor" : [ 0.8, 0.4, 0.1, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
, 			{
				"name" : "value",
				"default" : 				{
					"accentcolor" : [ 0.0, 0.4, 0.8, 1.0 ]
				}
,
				"parentstyle" : "",
				"multi" : 0
			}
 ]
	}

}
