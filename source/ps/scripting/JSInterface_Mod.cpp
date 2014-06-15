/* Copyright (C) 2014 Wildfire Games.
 * This file is part of 0 A.D.
 *
 * 0 A.D. is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * 0 A.D. is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with 0 A.D.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "precompiled.h"

#include "scriptinterface/ScriptInterface.h"
#include "scriptinterface/ScriptVal.h"

#include "ps/GameSetup/GameSetup.h"
#include "ps/GameSetup/Paths.h"
#include "ps/SavedGame.h" // g_modsLoaded; TODO move this somewhere else
#include "ps/scripting/JSInterface_Mod.h"

#include "lib/utf8.h"
#include "lib/file/file_system.h"
#include "lib/file/file_util.h"

#include <algorithm>

extern void restart_engine();

/**
 * Returns a JS object containing a listing of available mods that
 * have a modname.json file in their modname folder. The returned
 * object looks like { modname1: json1, modname2: json2, ... } where
 * jsonN is the content of the modnameN/modnameN.json file as a JS
 * object.
 *
 * @return JS object with available mods as the keys of the modname.json
 *         properties.
 */
CScriptVal JSI_Mod::GetAvailableMods(ScriptInterface::CxPrivate* pCxPrivate)
{
	// TODO unify all places where we get mod dirs? (the other place being GameSetup)

#define CONTINUE_IF_ERR(expr) \
	if ((expr) < 0) \
		continue

	ScriptInterface* scriptInterface = pCxPrivate->pScriptInterface;
	JSContext* cx = scriptInterface->GetContext();
	JSObject* obj = JS_NewObject(cx, NULL, NULL, NULL);

	// TODO store those paths somewhere so we can access them later on (within Paths, or some Mod code)

	CmdLineArgs args; // TODO this is bogus, but gets us somewhere, actually do something sane here
	const Paths paths(args); // ps/GameSetup/Paths.h (and get the cmdargs from somewhere)

	// loop over all possible paths
	OsPath modPath = paths.RData()/"mods";
	OsPath modUserPath = paths.UserData()/"mods";

	DirectoryNames modDirs;
	DirectoryNames modDirsUser;

	// TODO check status (and do something sensible)
	GetDirectoryEntries(modPath, NULL, &modDirs);
	// Sort modDirs so that we can do a fast lookup below
	std::sort(modDirs.begin(), modDirs.end());

	for (DirectoryNames::iterator iter = modDirs.begin(); iter != modDirs.end(); ++iter)
	{
		std::string buffer;
		CONTINUE_IF_ERR(ReadFile(modPath / *iter, iter->ChangeExtension(".json"), buffer));

		CScriptValRooted jsonContent = scriptInterface->ParseJSON(buffer);

		// Valid mod, add it to our structure
		JS::Value json = jsonContent.get();
		JS_SetProperty(cx, obj, utf8_from_wstring(iter->string()).c_str(), &json);
	}

	// TODO check status (and do something sensible)
	GetDirectoryEntries(modUserPath, NULL, &modDirsUser);
	bool dev = InDevelopmentCopy();

	for (DirectoryNames::iterator iter = modDirsUser.begin(); iter != modDirsUser.end(); ++iter)
	{
		// If we are in a dev copy we do not mount mods in the user mod folder that
		// are already present in the mod folder, thus we skip those here.
		if (dev && std::binary_search(modDirs.begin(), modDirs.end(), *iter))
			continue;

		std::string buffer;
		CONTINUE_IF_ERR(ReadFile(modUserPath / *iter, iter->ChangeExtension(".json"), buffer));

		CScriptValRooted jsonContent = scriptInterface->ParseJSON(buffer);

		// Valid mod, add it to our structure
		JS::Value json = jsonContent.get();
		JS_SetProperty(cx, obj, utf8_from_wstring(iter->string()).c_str(), &json);
	}
#undef CONTINUE_IF_ERR

	return OBJECT_TO_JSVAL(obj);
}

void JSI_Mod::RestartEngine(ScriptInterface::CxPrivate* UNUSED(pCxPrivate))
{
	restart_engine();
}

void JSI_Mod::SetMods(ScriptInterface::CxPrivate* UNUSED(pCxPrivate), std::vector<CStr> mods)
{
	g_modsLoaded = mods;
	// TODO write config settings too (maybe do so at the callsite)
}

void JSI_Mod::RegisterScriptFunctions(ScriptInterface& scriptInterface)
{
	scriptInterface.RegisterFunction<CScriptVal, &JSI_Mod::GetAvailableMods>("GetAvailableMods");
	scriptInterface.RegisterFunction<void, &JSI_Mod::RestartEngine>("RestartEngine");
	scriptInterface.RegisterFunction<void, std::vector<CStr>, &JSI_Mod::SetMods>("SetMods");
}
