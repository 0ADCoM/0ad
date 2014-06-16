// TODO rename public to 0ad?
// TODO move _all_ files (images, xml) that are needed in this mod over from public
// TODO Check savegame code to display nice mod names (after we have the logic for that)
// TODO Move this function out of the savegame code

// TODO Add functionality to allow multiple selected GUI objects?
// TODO Add dependency checking when enabling a mod.

/*============================================================
JSON structure as given by the Engine:

{
	"foldername1": { // this is the content of the json file in a specific mod
		name: "shortname", // eg "0ad", "rote"
		version: "0.0.16",
		label: "Nice Mod Name", // eg "0 A.D. - Empires Ascendant"
		type: "content|functionality|mixed/mod-pack", // TODO
		url: "http://modmod.wfg.com/", // URL of the mod
		description: "",
		total_size: 0, // TODO not really applicable currently (can be added later on if we really need it)
		dependencies: [], // (shortname({<,<=,==,>=,>}version)?)+
		is_experimental: true // TODO check if this is useful
	},
	"foldername2": {
		name: "mod2",
		label: "Mod 2",
		version: "1.1",
		type: "content|functionality|mixed/mod-pack",
		url: "http://play0ad.wfg.com/",
		description: "",
		total_size: 0,
		dependencies: [],
		is_experimental: false
	}
}
*/


var g_mods = {}; // Contains all JSONs as explained in the structure above
var g_modsEnabled = []; // folder names
var g_modsAvailable = []; // folder names

const SORT_BY_OPTION_ALPHANUMERICAL = 1;
const SORT_BY_OPTION_TOTAL_SIZE = 2;
var g_sortByOptions;
g_sortByOptions = [];
g_sortByOptions[SORT_BY_OPTION_ALPHANUMERICAL] = "Alphanumerical";
g_sortByOptions[SORT_BY_OPTION_TOTAL_SIZE] = "Total Size";
/*, "more sorting criteria"*/

var g_modTypes = [];

//======= Optional: Multiple Selected Objects TODO
var g_selectedObjects = []; // GUI objects/xml nodes.
//======= Optional -END 


/*=======FUNCTIONS============================================*/
/*
   Procedure: 
   1) Manipulate the global JSON mod lists (both enabled and available).
   2) Recreate the GUI list for each of these lists.

 */


/**
 * Fetches the mod lists in JSON from the Engine.
 * Initiates a first creation of the GUI lists.
 * Enabled mods are read from the Configuration and checked if still available.
 */
function init()
{
	// TODO Switch to actual mod data
	//g_modsAvailableJSON = Engine.GetModInfoJSON();
	g_mods = { 
		"0ad": {
			name: "0ad",
			label: "0 A.D.",
			type: "Mixed/ModPack/Game",
			url: "http://play0ad.com/",
			description: "Main Game + Base for most other mods (It's very likely you need to enable this!).",
			total_size: "100MB",
			dependencies: [],
			is_experimental: false
		},
		"eastern_civilizations": {
			name: "rote",
			label: "Rise of the East",
			type: "Mixed/ModPack/Addon",
			url: "http://play0ad.com/",
			description: "Adds all Eastern civilizations over the course of history to 0AD.",
			total_size: "300MB",
			dependencies: [ "0ad" ],
			is_experimental: false
		},
		"hundred_years_war": {
			name: "100yw",
			label: "Hundred Years War",
			type: "Content.Map Content.Campaign",
			url: "http://forum.wildfiregames.com/",
			description: ".",
			total_size: "900KB",
			dependencies: [ "0ad", "millennium" ], //first item loaded/mounted first
			is_experimental: true
		}
		//TODO Distinguish between official/checked + community + 3rd party/unchecked mods. (allow to set this level of security for multiplayer games on a per game level. Only allow if all the host's mods are available.)
	};


	// Enabled mods GUI list is empty when initializing and if no mod configuration has been saved to the config file before.
	g_modsEnabled = getExistingModsFromConfig();
	g_modsAvailable = Object.keys(g_mods).filter(function(i) { return g_modsEnabled.indexOf(i) === -1; });
	generateModsLists();

	//warn(uneval(Engine.GetEngineInfo()));
	//Engine.SetMods(["public", "rote"]);
}

/**
 * Recreating both the available and enabled mods lists.
 */
function generateModsLists()
{
	generateModsList('modsAvailableList', g_modsAvailable);
	generateModsList('modsEnabledList', g_modsEnabled);
}

function storeLabelsOfEnabledModsInConfig()
{
	warn("Save enabled mods: '"+g_modsEnabled.join(" ")+"'");

	//warn('Saving enabled mods to config: ' + modsEnabledLabelsAsString);
	//Engine.ConfigDB_CreateValue("user", "enabledMods", modsEnabledLabelsAsString);
}

function getExistingModsFromConfig()
{
	var existingMods = [];

	var mods = [];
	var cfgMods = "0ad rote"; // TODO get from config // mod folders!
	if (cfgMods.length)
		mods = cfgMods.split(" ");

	mods.forEach(function(mod) { 
		if (mod in g_mods)
			existingMods.push(mod);
	});

	return existingMods;
}

/**
 * (Re-)Generate List of all mods.
 * @param listObjectName The GUI object's name (e.g. "modsEnabledList", "modsAvailableList")
 */
function generateModsList(listObjectName, mods)
{
	warn('generating mod list: ' + listObjectName  + ' mods: ' +  mods);
	// 0) SORT THE MODS / LIST ITEMS
	var GUIList_sortBy = Engine.GetGUIObjectByName("sortBy"); 
	var isOrderDescending = Engine.GetGUIObjectByName("isOrderDescending");

	// sort alphanumerically:
	if (!GUIList_sortBy || GUIList_sortBy.selected == 0
	    || GUIList_sortBy.selected == -1)
	{
		mods.sort(function(akey, bkey)
		{
			var a = g_mods[akey];
			var b = g_mods[bkey];
			return ((a.label.toLowerCase() > b.label.toLowerCase()) ? 1 
				: (b.label.toLowerCase() > a.label.toLowerCase()) ? -1 
				: 0
			); 
		});
	}
	// sort by mod total size:
	else if (GUIList_sortBy.selected == 1)
	{
		mods.sort(function(akey, bkey)
		{
			var a = g_mods[akey];
			var b = g_mods[bkey];
			if (isOrderDescending && isOrderDescending.checked)
				return ((a.total_size > b.total_size) ? 1 
					: (b.total_size > a.total_size) ? -1 
					: 0);
			return ((a.total_size > b.total_size) ? -1 
				: (b.total_size > a.total_size) ? 1 
				: 0);
		});
	}

	// 1) FILTER OUT THOSE MODS THAT MATCH THE FILTERS
	var modFolderNameList = [];
	var modLabelList = [];
	var modDescriptionList = [];
	var modTypeList = [];
	var modUrlList = [];
	var modTotalSizeList = [];
	var modDependenciesList = [];
	mods.forEach(function(mod)
	{
		if (filterMod(g_mods[mod])) // TODO does this want a JSON?
			return;
//		if (g_modTypes.indexOf(jsonToReadModsFrom[key].type) !== -1)
//			g_modTypes.push(jsonToReadModsFrom[key].type); 

		modFolderNameList.push(mod);

		var modLabel = "Label";
		if (g_mods[mod].label)
			modLabel = g_mods[mod].label;
		if (g_mods[mod].is_experimental)
			modLabel = '[color="orange"]' + modLabel + '[/color]';
		modLabelList.push(modLabel);

		var modDescription = "Description";
		if (g_mods[mod].description)
			modDescription = g_mods[mod].description;
		modDescriptionList.push(modDescription);

		var modType = "Mixed/Mod-Pack";
		if (g_mods[mod].type)
			modType = g_mods[mod].type;
		modTypeList.push(modType);

		var modURL = "http://wildfiregames.com/";
		if (g_mods[mod].url)
			modURL = g_mods[mod].url;
		modUrlList.push(modURL);

		var modTotalSize = "0KB";
		if (g_mods[mod].total_size)
			modTotalSize = g_mods[mod].total_size;
		modTotalSizeList.push(modTotalSize);

		// TODO Just the mod.name (shortname property which should be unique (in the sense that different occurences of it must be the same mod (maybe different version)))
		var modDependencies = [ 'neverEverChanging-modInfoFile-DownloadLink', 'another-modInfoFile-DownloadLink', 'OR mod(Folder)Name', '' ];
		if (g_mods[mod].dependencies)
			modDependencies = g_mods[mod].dependencies.join(" ");
		modDependenciesList.push(modDependencies);
	});

	// 2) POPULATE GUI LISTS WITH THE SORTED AND FILTERED DATA.
	var obj  = Engine.GetGUIObjectByName(listObjectName);

	obj.list_name = modFolderNameList;
	obj.list_modLabel = modLabelList;
	obj.list_modType = modTypeList;
	obj.list_modURL = modUrlList;
	obj.list_modDescription = modDescriptionList;
	obj.list_modTotalSize = modTotalSizeList;
	obj.list_modDependencies = modDependenciesList;

	obj.list = modFolderNameList;

	var modTypeFilter = Engine.GetGUIObjectByName("modTypeFilter");
	modTypeFilter.list = g_modTypes;
}

function arePreconditionsMet()
{
	if (g_selectedObjects.isEmpty())
	{
		warn('None of the enabled mods selected.');
		return false;
	}
	return true;
}

function getPositionByValue(listObjectName, value)
{
	if (!listObjectName || !value)
		return -1;

	var gui_obj = Engine.GetGUIObjectByName(listObjectName);
	var gui_list = gui_obj.list;
	var selected_object = gui_list[gui_obj.selected];
	for (var pos = 0; pos < gui_list.length; pos++)
		if (gui_list[pos] == selected_object)
			return pos;

	return -1;
}

function enableMod()
{
	var obj = Engine.GetGUIObjectByName("modsAvailableList");
	var pos = obj.selected;

	var mod = g_modsAvailable[pos];
	warn("addMod: "+mod);

	// Move it to the other table
	// TODO check dependencies somewhere, or just warn about non-satisfied deps
	g_modsEnabled.push(g_modsAvailable.splice(pos, 1)[0]);

	// TODO adjust the index, but if there are no more elements left set it to -1 (no selection)
	obj.selected = -1;

	generateModsLists();
}

function disableMod()
{
	var obj = Engine.GetGUIObjectByName("modsEnabledList");
	var pos = obj.selected;

	var mod = g_modsEnabled[pos];
	warn("removeMod: "+mod);

	// TODO Add it to g_modsAvailable in a sorted way
	g_modsAvailable.push(g_modsEnabled.splice(pos, 1)[0]);

	// TODO set selected to something sensible
	obj.selected = -1;

	generateModsLists();
}

function resetFilters()
{
	// Reset states of gui objects.
	Engine.GetGUIObjectByName("modTypeFilter").selected = 0;
	Engine.GetGUIObjectByName("showExperimentalModsFilter").checked = false;
	Engine.GetGUIObjectByName("modGenericFilter").caption = "";

	// Update the list of mods. 
	generateModsLists();
}

function applyFilters()
{
	generateModsLists();
	//updateModSelection();
}

/**
 * Filter a mod based on the status of the filters.
 *
 * @param mod Mod to be tested.
 * @return True if mod should not be displayed.
 */
function filterMod(mod)
{
	var modTypeFilter = Engine.GetGUIObjectByName("modTypeFilter");
	var showExperimentalModsFilter = Engine.GetGUIObjectByName("showExperimentalModsFilter");
	var genericFilter = Engine.GetGUIObjectByName("modGenericFilter");

	// We assume index 0 means display all for any given filter.
	if (modTypeFilter.selected != 0 && modTypeFilter.selected != -1 
	    && mod.type != modTypeFilter.list[modTypeFilter.selected])
	{
		warn('mod type filter');
		return true;
	}

	if (!showExperimentalModsFilter.checked && mod.isExperimental)
	{
		warn('experimental filter filtered out an experimental mod');
		return true;
	}

	if (genericFilter && genericFilter.caption && genericFilter.caption != "")
	{
		var t = genericFilter.caption;
		if (mod.label.indexOf(t) != -1
		    || mod.type.indexOf(t) != -1
		    || mod.url.indexOf(t) != -1
		    || mod.total_size.indexOf(t) != -1
		    || mod.description.indexOf(t) != -1
		    || (/*typeof mod.dependencies == 'array' && WORKS FOR BOTH ARRAY AND STRING*/ mod.dependencies.indexOf(t) != -1)
		    )
		{
			warn('generic filter');
			return true;
		}
	}

	return false;
}

function closePage()
{
	Engine.SwitchGuiPage("page_pregame.xml", {});
//	Engine.RestartEngine();
}


/**
 Moves up or down an item in the list by the specified amount @p moveBy. (working but not reordering sublists as it can't know which sublists/headers have been defined. Solve this using by giving a @p guiUpdate_callback function.)
 @param objectName The list object's name as specified in the XML.
 @param moveBy  If positive then move up by this number.
                If negative then move down by this number.
                Default is to move by +1, i.e. move up by one.
 */
function moveCurrItem(objectName, moveBy = 1, objectNameAppend = '', guiUpdate_callback = null)
{
	objectName = objectName + "" + objectNameAppend;
	warn('moveCurrItem: ' + objectName);
	// reuse the check for null and if something is selected.
	if (getCurrItemValue(objectName) == "")
		return;

	var selectedIndex = Engine.GetGUIObjectByName(objectName).selected;
	var listItemCount = getNumItems(objectName);
	warn('selectedIndex: ' + selectedIndex + ' to be moved by ' + moveBy);

	// Check if move would be a nop
	if ((moveBy < 0 && selectedIndex < 1)
	    || (moveBy > 0 && selectedIndex == listItemCount - 1))
		return;
	
	var source_index = selectedIndex;
	var target_index = source_index + moveBy;
	// Is target object index valid?
	if (target_index < 0 || target_index >= listItemCount)
		return;

	// => incremental move to destination position. shift all passed elements.
	var list = Engine.GetGUIObjectByName(objectName).list;
	while (selectedIndex != target_index)
	{
		var swap_index1 = selectedIndex;
		// use the sign for the correct direction, but normalize to 1
		// as we must swap the object directly preceding or succeding.
		// Otherwise the order of the objects is not upheld.
		var swap_index2 = selectedIndex + moveBy / Math.abs(moveBy);
		//swap(objectName, swap_index1, swap_index2);
		var tmp = list[swap_index1];
		list[swap_index1] = list[swap_index2];
		list[swap_index2] = tmp;
	
		selectedIndex = swap_index2;
	}

	// Selected object reached the new position. Update the enginescoped list:
	Engine.GetGUIObjectByName(objectName).list = list;
	Engine.GetGUIObjectByName(objectName).selected = selectedIndex;
	
	if (guiUpdate_callback)
		guiUpdate_callback(objectName);
}

