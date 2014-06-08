function init()
{
	var list = Engine.GetGUIObjectByName("gamesBox");

	// TODO remove test data
	list.list_name = ["0 A.D.", "Rise of the East", "bla"];
	list.list_modSite = ["play0ad.com", "", ""];
	list.list_modDescription = ["0 A.D. nuff said.", "A Chinese civ addon for 0 A.D.", "something"];
	list.list_modTotalSize = ["123", "1", "0"];
	list.list = ["public", "rote", "bla"]; // Use the mod folder name here
	// TODO rename public to 0ad?
	// TODO filter the mod mod

	// TODO Check savegame code to display nice mod names (after we have the logic for that)

	// TODO Move this function out of the savegame code
	//warn(uneval(Engine.GetEngineInfo()));
	warn(uneval(Engine.GetAvailableMods()));
}

function modSelectionChanged()
{
	;
}

function onTick()
{
	;
}

function closePage()
{
	Engine.SwitchGuiPage("page_pregame.xml", {});
}
