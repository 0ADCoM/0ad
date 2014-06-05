function init()
{
	var list = Engine.GetGUIObjectByName("gamesBox");

	// TODO remove test data
	list.list_name = ["0 A.D.", "Rise of the East", "bla"];
	list.list_modSite = ["play0ad.com", "", ""];
	list.list_modDescription = ["0 A.D. nuff said.", "A Chinese civ addon for 0 A.D.", "something"];
	list.list_modTotalSize = ["123", "1", "0"];
	list.list = ["0ad", "rote", "bla"]; // Use the mod folder name here
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
