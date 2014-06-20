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

var g_sortByOptions = ["-", "Alphanumerical", "Total Size"];

var g_modTypes = [];//["Mod Types Filter", "Any"];

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
	g_mods = Engine.GetAvailableMods();

	g_modsEnabled = getExistingModsFromConfig();
	g_modsAvailable = Object.keys(g_mods).filter(function(i) { return g_modsEnabled.indexOf(i) === -1; });

	Engine.GetGUIObjectByName("showExperimentalModsFilter").checked = false;
	generateModsLists();
}

/**
 * Recreating both the available and enabled mods lists.
 */
function generateModsLists()
{
	generateModsList('modsAvailableList', g_modsAvailable);
	generateModsList('modsEnabledList', g_modsEnabled);
}

function saveMods()
{
	// TODO make sure that "mod" is prepended to that
	warn("Save enabled mods: '"+"mod "+g_modsEnabled.join(" ")+"'");

	//warn('Saving enabled mods to config: ' + modsEnabledLabelsAsString);
	//Engine.ConfigDB_CreateValue("user", "enabledMods", modsEnabledLabelsAsString);
}

function startMods()
{
	// TODO what to do about user mod? (make SetMods() handle this?)

	Engine.SetMods(["mod"].concat(g_modsEnabled));
	Engine.RestartEngine();
}

function getExistingModsFromConfig()
{
	var existingMods = [];

	var mods = [];
	var cfgMods = "public rote"; // TODO get from config // mod folders!
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
	var sortBy = Engine.GetGUIObjectByName("sortBy");
	var orderDescending = Engine.GetGUIObjectByName("isOrderDescending");
	var isDescending = orderDescending && orderDescending.checked;

	// Enabled mods should not be sorted (or at least not by default,
	// at least in one of the ways below; sorting them according to
	// dependencies might be nice) (TODO)
	if (listObjectName != "modsEnabledList")
	{
		// sort alphanumerically:
		if (!sortBy || sortBy.selected <= 0)
		{
			mods.sort(function(akey, bkey)
			{
				var a = g_mods[akey];
				var b = g_mods[bkey];
				return ((a.label.toLowerCase() > b.label.toLowerCase()) ? 1 
					: (b.label.toLowerCase() > a.label.toLowerCase()) ? -1 
					: 0); 
			});
		}
		// sort by mod total size:
		else if (sortBy.selected == 1)
		{
			mods.sort(function(akey, bkey)
			{
				var a = g_mods[akey];
				var b = g_mods[bkey];
				var ret = ((a.total_size > b.total_size) ? -1 
					: (b.total_size > a.total_size) ? 1 
					: 0);
				return ret * (isDescending ? -1 : 1);
			});
		}
	}

	var modFolderNameList = [];
	var modLabelList = [];
	var modDescriptionList = [];
	var modTypeList = [];
	var modUrlList = [];
	var modTotalSizeList = [];
	var modDependenciesList = [];
	mods.forEach(function(mod)
	{
		if (g_modTypes.indexOf(g_mods[mod].type) == -1)
			g_modTypes.push(g_mods[mod].type); 
		if (filterMod(g_mods[mod]))
			return;

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

	// Update the list
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

function enableMod()
{
	var obj = Engine.GetGUIObjectByName("modsAvailableList");
	var pos = obj.selected;
	if (pos === -1)
		return;

	var mod = g_modsAvailable[pos];

	// Move it to the other table
	// TODO check dependencies somewhere, or just warn about non-satisfied deps
    if (!areDependenciesMet(mod))
        return;

	g_modsEnabled.push(g_modsAvailable.splice(pos, 1)[0]);

	if (pos >= g_modsAvailable.length)
		pos--;
	obj.selected = pos;

	generateModsLists();
}

function disableMod()
{
	var obj = Engine.GetGUIObjectByName("modsEnabledList");
	var pos = obj.selected;
	if (pos === -1)
		return;

	var mod = g_modsEnabled[pos];

	g_modsAvailable.push(g_modsEnabled.splice(pos, 1)[0]);

	if (pos >= g_modsEnabled.length)
		pos--;
	obj.selected = pos;

	generateModsLists();
}

function resetFilters()
{
	// Reset states of gui objects.
	Engine.GetGUIObjectByName("modTypeFilter").selected = -1;
	Engine.GetGUIObjectByName("showExperimentalModsFilter").checked = false;
	Engine.GetGUIObjectByName("modGenericFilter").caption = "";

	// NOTE: Calling generateModsLists() is not needed as the selection changes and that calls applyFilters()
}

function applyFilters()
{
	generateModsLists();
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

function areDependenciesMet(mod)
{
    for each (var dependency in g_mods[mod].dependencies)
    {
        if (!isDependencyMet(dependency))
        {
            Engine.GetGUIObjectByName("message").caption = 'Message: [color="250 100 100"]Dependency not met: '+ dependency +'[/color]';
            return false;
        }
    }
    Engine.GetGUIObjectByName("message").caption = 'Message: [color="100 250 100"]All dependencies met: '+ g_mods[mod].dependencies.join(' ') +'[/color]';
    return true;

}

function isDependencyMet(dependency) 
{
    // modsEnabled_key currently is the mod folder name.
    for each (var modsEnabled_key in g_modsEnabled)
    {
        // e.g. 0ad.001   (if the mod folder name was renamed.)
        // TODO what about version numbers?
        if (modsEnabled_key.indexOf(dependency) !== -1)
            return true;
        var modJson = g_mods[modsEnabled_key];
        if (modJson.label == dependency || modJson.name == dependency)
            return true;
    }
    return false;
}
