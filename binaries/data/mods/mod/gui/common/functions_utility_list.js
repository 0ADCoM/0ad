/*
	DESCRIPTION	: Functions to manipulate objects with a 'list' property
			  (used to handle the items in list, dropdown, etc.)
	NOTES		: To ensure the selection is properly updated, it is important to
			  use these functions and not manually access the list.
*/

// ====================================================================

// Remove the item at the given index (pos) from the given list object (objectName).
function removeItem (objectName, pos)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "removeItem()", object: objectName }));

	var list = Engine.GetGUIObjectByName (objectName).list;
	var selected = Engine.GetGUIObjectByName (objectName).selected;

	list.splice(pos, 1);

	Engine.GetGUIObjectByName (objectName).list = list;

	// It's important that we update the selection *after*
	//  we've committed the changes to the list.

	// Update the selected so the same element remains selected.
	if (selected == pos)
	{
		Engine.GetGUIObjectByName (objectName).selected = -1;
	}
	else
	if (selected > pos)
	{
		Engine.GetGUIObjectByName (objectName).selected = selected - 1;
	}
}

// ====================================================================

// Add the item at the given index (pos) to the given list object (objectName) with the given value (value).
function addItem (objectName, pos, value)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "addItem()", object: objectName }));

	var list = Engine.GetGUIObjectByName (objectName).list;
	var selected = Engine.GetGUIObjectByName (objectName).selected;

	list.splice (pos, 0, value);

	Engine.GetGUIObjectByName (objectName).list = list;

	// It's important that we update the selection *after*
	//  we've committed the changes to the list.

	// Update the selected so the same element remains selected.
	if (selected >= pos)
	{
		Engine.GetGUIObjectByName (objectName).selected = selected + 1;
	}
}

// ====================================================================

// Adds an element to the end of the list
function pushItem (objectName, value)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "pushItem()", object: objectName }));

	var list = Engine.GetGUIObjectByName (objectName).list;
	list.push (value);
	Engine.GetGUIObjectByName (objectName).list = list;
	// Point to the new item.
	Engine.GetGUIObjectByName(objectName).selected = getNumItems(objectName)-1;
}

// ====================================================================

// Removes the last element
function popItem (objectName)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "popItem()", object: objectName }));

	var selected = Engine.GetGUIObjectByName (objectName).selected;
	removeItem(objectName, getNumItems(objectName)-1);

	if (selected == getNumItems(objectName)-1)
	{
		Engine.GetGUIObjectByName(objectName).selected = -1;
	}
}

// ====================================================================

// Retrieves the number of elements in the list
function getNumItems (objectName)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "getNumItems()", object: objectName }));

	var list = Engine.GetGUIObjectByName(objectName).list;
	return list.length;
}

// ====================================================================

// Retrieves the value of the item at 'pos'
function getItemValue (objectName, pos)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "getItemValue()", object: objectName }));

	var list = Engine.GetGUIObjectByName(objectName).list;
	return list[pos];
}

// ====================================================================

// Retrieves the value of the currently selected item
function getCurrItemValue (objectName)
{
	if (Engine.GetGUIObjectByName (objectName) == null)
    {
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "getCurrItemValue()", object: objectName }));
        return "";
    }


	if (Engine.GetGUIObjectByName(objectName).selected == -1)
		return "";
	var list = Engine.GetGUIObjectByName(objectName).list;
	return list[Engine.GetGUIObjectByName(objectName).selected];
}

// ====================================================================

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
// Sets current item to a given string (which must be one of those
// already in the list).
function setCurrItemValue (objectName, string)
{
	if (Engine.GetGUIObjectByName(objectName) == null)
	{
		Engine.Console_Write (sprintf(translate("%(functionName)s: %(object)s not found."), { functionName: "setCurrItemValue()", object: objectName }));
		return -1;
	}

	if (Engine.GetGUIObjectByName(objectName).selected == -1)
		return -1;	// Return -1 if nothing selected.
	var list = Engine.GetGUIObjectByName(objectName).list;
	// Seek through list.
	for (var ctr = 0; ctr < list.length; ctr++)
	{
		// If we have found the string in the list,
		if (list[ctr] == string)
		{
			// Point selected to this item.
			Engine.GetGUIObjectByName(objectName).selected = ctr;
			return ctr;	// Return position of item.
		}
	}

	// Return -2 if failed to find value in list.
	Engine.Console_Write (sprintf(translate("Requested string '%(string)s' not found in %(object)s's list."), { string: string, object: objectName }));
	return -2;
}

// ====================================================================
