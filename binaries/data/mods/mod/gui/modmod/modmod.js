/*============================================================
 
	// TODO rename public to 0ad?

	// TODO move _all_ files (images, xml) that are needed in this mod over from public

	// TODO Check savegame code to display nice mod names (after we have the logic for that)

	// TODO Move this function out of the savegame code
	//warn(uneval(Engine.GetEngineInfo()));
    
    // TODO Add functionality to allow multiple selected GUI objects?
    // TODO Add dependency checking when enabling a mod.
*/



/*============================================================
JSON structure as given by the Engine:

{
    "mod_1": { 
        label: "Mod 1",
        type: "content|functionality|mixed/mod-pack",
        site_url: "http://modmod.wfg.com/",
        description: "",
        total_size: 0,
        dependencies: [],
        is_experimental: true
    },
    "mod_2": {
        label: "Mod 2",
        type: "content|functionality|mixed/mod-pack",
        site_url: "http://play0ad.wfg.com/",
        description: "",
        total_size: 0,
        dependencies: [],
        is_experimental: false
    },
    ...

	warn(uneval(Engine.GetAvailableMods()));
}
*/



/*=======ATTRIBUTES===========================================*/
var g_modsEnabledJSON = {};
var g_modsAvailableJSON = {};
var g_modsEnabledJSON_keys_ordered = [];

var SORT_BY_OPTION_ALPHANUMERICAL = 1;
var SORT_BY_OPTION_TOTAL_SIZE = 2;
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
   Fetches the mod lists in JSON from the Engine.
   Initiates a first creation of the GUI lists.
   Enabled mods are read from the Configuration and checked if still available.
    
 */
function init()
{
    /*
    // TODO uncomment once the engine functionality is there.
    g_modsAvailableJSON = Engine.GetModInfoJSON();
    */
    // TODO Comment out test data.
	g_modsAvailableJSON = { 
        "0ad": {
            label: "0 A.D.",
            type: "Mixed/ModPack/Game",
            site_url: "http://play0ad.com/",
            description: "Main Game + Base for most other mods (It's very likely you need to enable this!).",
            total_size: "100MB",
            dependencies: [],
            is_experimental: false
        },
        "eastern_civilizations": {
            label: "Rise of the East",
            type: "Mixed/ModPack/Addon",
            site_url: "http://play0ad.com/",
            description: "Adds all Eastern civilizations over the course of history to 0AD.",
            total_size: "300MB",
            dependencies: [ "0ad" ],
            is_experimental: false
        },
        "hundred_years_war": {
            label: "Hundred Years War",
            type: "Content.Map Content.Campaign",
            site_url: "http://forum.wildfiregames.com/",
            description: ".",
            total_size: "900KB",
            dependencies: [ "0ad", "millennium" ], //first item loaded/mounted first
            is_experimental: true
        }
        //TODO Distinguish between official/checked + community + 3rd party/unchecked mods. (allow to set this level of security for multiplayer games on a per game level. Only allow if all the host's mods are available.)
        
        /* More Mods. */

    }


    // Enabled mods GUI list is empty when initializing and if no mod configuration has been saved to the config file before.
    g_modsEnabledJSON = getStillAvailableEnabledModsInJsonUsingTheListOfEnabledModsAsStoredInTheConfigurationFile();
    generateModsLists();
   

    //	warn(uneval(Engine.GetEngineInfo()));
    //	Engine.SetMods(["public", "rote"]);

    
}




/**
   Recreating both the available and enabled mods lists.
 */
function generateModsLists()
{
    // (re-)create GUI list for all mods
    generateModsList('modsAvailableList', g_modsAvailableJSON);
    // (re-)create GUI list for enabled mods
    generateModsList('modsEnabledList', g_modsEnabledJSON);

}




/**
   
 */
function storeLabelsOfEnabledModsInConfig(ordered = true)
{

    var modsEnabledLabelsAsString = "";
    var modsEnabledLabels = [];

    var keys = Object.keys(g_modsEnabledJSON);
    if (ordered && g_modsEnabledJSON_keys_ordered)
        keys = g_modsEnabledJSON_keys_ordered;

    for each (var enabledMod_key in keys)
    {
        modsEnabledLabelsAsString += " " + g_modsEnabledJSON[enabledMod_key].label;
    }

    warn('Saving enabled mods to config: ' + modsEnabledLabelsAsString);
    Engine.ConfigDB_CreateValue("user", "enabledMods", modsEnabledLabelsAsString);
}




/**
   
 */
function getStillAvailableEnabledModsInJsonUsingTheListOfEnabledModsAsStoredInTheConfigurationFile()
{
    var enabledModsAsPerConfigThatAreStillAvailable = {};

    // check each as per config enabled mod if the mod is still available:
    var enabledModsAsPerConfig = Engine.ConfigDB_GetValue("user", "enabledMods");
    for each (var enabledModAsPerConfigLabel in enabledModsAsPerConfig)
    {
        // Is mod still available?
        for each (var availableMod_key in Object.keys(g_modsAvailableJSON))
        {
            var availableMod = g_modsAvailableJSON[availableMod_key];
            // check for the label as the folder name might have been renamed as those have to be unique (then we could potentially fail to find the folder name).
           // Is the per config enabled mod equal to the currently examined mod of all the available mods list? TODO check for similarity (as there might be more mods for the same purpose and both would match the requirements).
            if (availableMod.label == enabledModAsPerConfigLabel)
            {
                enabledModsAsPerConfigThatAreStillAvailable[availableMod_key] = availableMod;
                break; //the inner for loop
            }
        }

    }
    // Only the still available mods remain.
    return enabledModsAsPerConfigThatAreStillAvailable;
}


function arrayToString(array)
{
    var string = "";
    var space = "";
    for each (var entry in array)
    {
        string += space + entry;
        space = " ";
    }
    return string;
}



/**
   (Re-)Generate List of all mods.
   @param listObjectName The GUI object's name (e.g. "modsEnabledList", "modsAvailableList")
 */
function generateModsList(listObjectName, jsonToReadModsFrom) {

    warn('generating mod list: ' + listObjectName  + ' json: ' +  jsonToReadModsFrom);
    // 0) SORT THE MODS / LIST ITEMS
    var GUIList_sortBy = Engine.GetGUIObjectByName("sortBy"); 
    var isOrderDescending = Engine.GetGUIObjectByName("isOrderDescending");

    // sort alphanumerically:
    var jsonToReadModsFrom_keys_sorted = Object.keys(jsonToReadModsFrom);
    if (!GUIList_sortBy || GUIList_sortBy.selected == 0
            || GUIList_sortBy.selected == -1) {
                
        jsonToReadModsFrom_keys_sorted.sort(
            function(akey, bkey)
            {
                var a = jsonToReadModsFrom[akey];
                var b = jsonToReadModsFrom[bkey];
                return ((a.label.toLowerCase() > b.label.toLowerCase()) ? 1 
                    : (b.label.toLowerCase() > a.label.toLowerCase()) ? -1 
                    : 0
                ); 
            }
        );
    } 
    // sort by mod total size:
    else if (GUIList_sortBy.selected == 1) {
        
        jsonToReadModsFrom_keys_sorted.sort(
            function(akey, bkey)
            {
                var a = jsonToReadModsFrom[akey];
                var b = jsonToReadModsFrom[bkey];
                if (isOrderDescending && isOrderDescending.checked)
                    return ((a.total_size > b.total_size) ? 1 
                            : (b.total_size > a.total_size) ? -1 
                            : 0);
                return ((a.total_size > b.total_size) ? -1 
                        : (b.total_size > a.total_size) ? 1 
                        : 0);
            }
        );
    }

    // 1) FILTER OUT THOSE MODS THAT MATCH THE FILTERS
    var modFolderNameList = [];
    var modLabelList = [];
    var modDescriptionList = [];
    var modTypeList = [];
    var modSiteUrlList = [];
    var modTotalSizeList = [];
    var modDependenciesList = [];
    for each (var key in jsonToReadModsFrom_keys_sorted)
    {
        //warn('key: ' + key);

        if (filterMod(jsonToReadModsFrom[key])) 
            continue;
        if (g_modTypes.indexOf(jsonToReadModsFrom[key].type) !== -1)
           g_modTypes.push(jsonToReadModsFrom[key].type); 

        var modFolderName = key;
        modFolderNameList.push(modFolderName);

        var modLabel = "Label";
        if (jsonToReadModsFrom[key].label)
            modLabel = jsonToReadModsFrom[key].label;
        if (jsonToReadModsFrom[key].is_experimental)
            modLabel = '[color="orange"]' + modLabel + '[/color]';
        modLabelList.push(modLabel);

        var modDescription = "Description";
        if (jsonToReadModsFrom[key].description)
            modDescription = jsonToReadModsFrom[key].description;
        modDescriptionList.push(modDescription);

        var modType = "Mixed/Mod-Pack";
        if (jsonToReadModsFrom[key].type)
            modType = jsonToReadModsFrom[key].type;
        modTypeList.push(modType);

        var modSiteURL = "http://wildfiregames.com/";
        if (jsonToReadModsFrom[key].site_url)
            modSiteURL = jsonToReadModsFrom[key].site_url;
        modSiteUrlList.push(modSiteURL);

        var modTotalSize = "0KB";
        if (jsonToReadModsFrom[key].total_size)
            modTotalSize = jsonToReadModsFrom[key].total_size;
        modTotalSizeList.push(modTotalSize);

        var modDependencies = [ 'neverEverChanging-modInfoFile-DownloadLink', 'another-modInfoFile-DownloadLink', 'OR mod(Folder)Name', '' ];
        if (jsonToReadModsFrom[key].dependencies)
            modDependencies = arrayToString(jsonToReadModsFrom[key].dependencies);
        modDependenciesList.push(modDependencies);

    }



    // 2) POPULATE GUI LISTS WITH THE SORTED AND FILTERED DATA.
	var obj  = Engine.GetGUIObjectByName(listObjectName);
    
	obj.list_name = modFolderNameList;
	obj.list_modLabel = modLabelList;//["0 A.D.", "Rise of the East", "bla"];
	obj.list_modType = modTypeList;//["Mixed/ModPack/Game", "Content.Map", "Content.Campaign", "Content.Civilization", "Content.Textures", "Content.3DModel", "Functionality"];
	obj.list_modSiteURL = modSiteUrlList;//["play0ad.com", "", ""];
	obj.list_modDescription = modDescriptionList;//["0 A.D. nuff said.", "A Chinese civ addon for 0 A.D.", "something"];
	obj.list_modTotalSize = modTotalSizeList;//["123", "1", "0"];
	obj.list_modDependencies = modDependenciesList;//["modFolderName OR modLabel OR modDownloadLink?", "modFolderName2", "modFolderName3"];

	obj.list = modFolderNameList;//["public", "rote", "bla"]; // Use the mod folder name here
    //obj.list_data = /*index or additional data*/;



    var modTypeFilter = Engine.GetGUIObjectByName("modTypeFilter");
    modTypeFilter.list = g_modTypes;

}


function addIfNotExists(obj, array) {

    // Object already exists in the array?
    if (array.indexOf(obj) !== -1)
        return ;

    // else add the object:
    array[array.length] = obj;

}


/*
 Note:  An object's name is somewhat unique.
 Note:  Currently the engine does not return
        all objects matching a certain regex.
        Though such a function could be added
        if desired.
 */
var modEnabledContext = { 
    // The selection is operated on, e.g.
    // removed from the list et alia. (see buttons' action)
    selected_list_row_objects: []
};
function modsEnabledListSelectionChanged(obj)
{
/*    
    if (typeof obj == 'string')
        obj = Engine.GetGUIObjectByName(obj);
    if (!obj) 
        return;

    // Add to selection if not already happened previously:
    addIfNotExists(obj, modEnabledContext.selected_list_row_objects);
    // Visualize that row is selected:
    obj.style = "RowSelected";

*/	

}


function arePreconditionsMet() {
    
    if (g_selectedObjects.isEmpty())
    {
        warn('None of the enabled mods selected.');
        return false;
    }
    return true;
}


function getPositionByValue(listObjectName, value)
{    
    if (listObjectName && value)
    {
        var pos = -1;
        var gui_obj = Engine.GetGUIObjectByName(listObjectName);
        var gui_list = gui_obj.list;
        var selected_object = gui_list[gui_obj.selected];
        while (++pos < gui_list.length)
        {
            if (gui_list[pos] == selected_object)
                return pos;
        }
    }
    return -1;
}


 


/**
   To enable a mod execute as follows:
   addSelectedToList('modsAvailableList', g_modsAvailable, 'modsEnabledList', g_modsEnabled);
 */
function addSelectedToList(sourceListObjectName, sourceJson, targetListObjectName, targetJson, removeFromSourceJson = false)
{
    var gui_obj = Engine.GetGUIObjectByName(sourceListObjectName);
    var list = gui_obj.list;
    var pos = gui_obj.selected;
    var name = list[pos];
    warn('name: ' + name + ' at pos: ' + pos + ' from list: '
            + list);

    // find the mod data entry to add:
    var json_key = null;
    for each (json_key in Object.keys(sourceJson))
        if (json_key == name)
        {
            // e.g. add the available mod data entry to the enabled list (overwriting the old data associated with this key):
            targetJson[json_key] = sourceJson[json_key];
            if (removeFromSourceJson)
                delete sourceJson[json_key];
            break;
        }

    // maintain the ordering of the enabledMods:
    g_modsEnabledJSON_keys_ordered.push(json_key);

    // update the GUI:
    generateModsList(targetListObjectName, targetJson);
    if (removeFromSourceJson)
        generateModsList(sourceListObjectName, sourceJson);

}




function removeSelectedFromList(listObjectName, jsonToRemoveFrom,
       jsonToRemoveFrom_keys_ordered = null, jsonToAddRemovedTo = null, jsonToAddRemovedToGuiListObjectName = "")
{
    warn('removeSelectedFromList: listObjectName: ' + listObjectName);
    // single selected object:
    var obj = Engine.GetGUIObjectByName(listObjectName);
    var pos = obj.selected;
    // The GUI way:
//    removeItem(listObjectName, pos);

    // The recreation way:
    var name = obj.list[pos];
    warn('name: ' + name + ' at pos: ' + pos + ' from list: '
            + obj.list);

    // find the mod data entry for removal:
    var keys = Object.keys(jsonToRemoveFrom);
    if (jsonToRemoveFrom_keys_ordered)
        keys = jsonToRemoveFrom_keys_ordered;
    for (var index = 0; index < keys.length; index++)
    {
        var key = keys[index];
        if (key == name)
        {
            warn('deleting mod '+ key +' from list: ' + listObjectName);
            if (jsonToAddRemovedTo)
                jsonToAddRemovedTo[key] = jsonToRemoveFrom[key];
            delete jsonToRemoveFrom[key];
            if (jsonToRemoveFrom_keys_ordered)
                jsonToRemoveFrom_keys_ordered.splice(index, 1);
            break;
        }
    }

    // multiple selected objects: TODO test if useful and works
    if (g_selectedObjects != null && g_selectedObjects.length != 0)
    {
        var areAllSelectedObjectsRemoved = true;
        for each (var selected_object in g_selectedObjects)
        {
            // figure out list position to be able to use utility functions.
            var pos = getPositionByValue(listObjectName, selected_object);
            if (!pos || pos == -1)
            {
                 areAllSelectedObjectsRemoved = false;
                continue;
            }

            removeItem(listObjectName, pos);
        }

    }

    // recreate the GUI list
    generateModsList(listObjectName, jsonToRemoveFrom);
    if (jsonToAddRemovedTo && jsonToAddRemovedToGuiListObjectName != "")
        generateModsList(jsonToAddRemovedToGuiListObjectName, jsonToAddRemovedTo);

}


function modsAvailableListSelectionChanged(xmlNode)
{
    // TODO for multiple selections.
	// modsAvailableContext.selected_objects.push(xmlNode);
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
                || mod.site_url.indexOf(t) != -1
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



function deleteSelectedMod(listObjectName)
{
    var obj = Engine.GetGUIObjectByName(listObjectName);
    var modFolderName = obj.list[obj.selected];
    // TODO
    Engine.deleteMod(modFolderName);
}





function onTick()
{
	;
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
    if (getCurrItemValue(objectName) != "")
    {
        var selectedIndex = Engine.GetGUIObjectByName(objectName).selected;
        var listItemCount = getNumItems(objectName);
        warn('selectedIndex: ' + selectedIndex 
                + ' to be moved by ' + moveBy);

        // Move up but already First element?
        if (moveBy < 0 && selectedIndex < 1)
        {
            // => Nothing to do.
            warn('Already first element.');
        }
        // Move down but already Last element?
        else if (moveBy > 0 && selectedIndex == listItemCount - 1)
        {
            // => Nothing to do.
            warn('Already last element.');
        }
        else
        {
            // => Move.
            var source_index = selectedIndex;
            var target_index = source_index + moveBy;
            // Is target object index valid?
            if (target_index > -1 && target_index < listItemCount)
            {
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
                {
                    // update the GUI sublists to the main list.
                    guiUpdate_callback(objectName);
                }
            }
                
        }
    }
}

