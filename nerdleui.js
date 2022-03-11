function addRow(kBodyRoot, kText, listenerFunction, bSetUnknown=false)
{
    rowNodes = [];

    kRowRootNode = document.createElement("tr");
    
    for (var i = 0; i < kText.length; ++i)
    {
        rowNodes[i] = document.createElement("td");
        if (kText[i] == '\n')
        {
            rowNodes[i].appendChild(document.createTextNode("Copy"));
        }
        else if (kText[i] == '\b')
        {
            rowNodes[i].appendChild(document.createTextNode("Delete"));
        }
        else
        {
            rowNodes[i].appendChild(document.createTextNode(kText[i]));
        };
        rowNodes[i].addEventListener("click", listenerFunction);
        if (bSetUnknown)
        {
            rowNodes[i].classList.add(E_NODE_POSITION_UNKNOWN);
        }
        kRowRootNode.appendChild(rowNodes[i]);
    }

    kBodyRoot.appendChild(kRowRootNode);
    
    return rowNodes;
}

function initialise()
{
    // Root of the Solver Table
    kBodyRoot = document.getElementById("solver");

    // Root of the Dimmer
    kDimming = document.getElementById("dimmer");
    
    // Create the First Row
    kCurrentRow = addRow(kBodyRoot, "        ", clickFunction, true);
    kAllRows.push(kCurrentRow);
    selectNode(kCurrentRow[0]);

    // Root of the Keyboard Table
    kVirtuakKeyboardNumbers   = addRow(document.getElementById("keyboardRow1"), kValidNumbers,   virtualKeyboardFunction, true);
    kVirtuakKeyboardOperators = addRow(document.getElementById("keyboardRow2"), kValidOperators, virtualKeyboardFunction, true);
    kVirtualKeyboardCommands  = addRow(document.getElementById("keyboardRow3"), "\n\b",          virtualKeyboardFunction, true);

    // Suggestion
    kSuggestionRoot = document.getElementById("suggestion")
    kSuggestions = addRow(kSuggestionRoot, "9*8-7=65", clickSuggestionFunction);

    // Add the Issues Text Node
    kIssuesTextNode = document.createTextNode("No Issues");
    document.getElementById("issues").appendChild(kIssuesTextNode);
    
    // Add the Messages Text Node
    kMessagesTextNode = document.createTextNode("Please enter an equation to check, or just press Enter whilst blank to accept the suggestion");
    document.getElementById("messages").appendChild(kMessagesTextNode);
    
    document.addEventListener("keydown", keypressFunction);

    // Initialise the Solver
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        kSolverRowData[i] = "";
        var kIsnt  = "";
        if ((0 == i) || (i == (kCurrentRow.length-1)))
        {
            for (var j = 0; j < kValidOperators.length; ++j)
            {
                const kChar = kValidOperators[j];
                if (!kValidNumbersWithSign.includes(kChar) || (i == (kCurrentRow.length - 1)))
                {
                    kIsnt += kChar;
                }
            }
        }
        
        for (var j = 0; j < kValidChars.length; ++j)
        {
            const kChar = kValidChars[j];
            if (!kIsnt.includes(kChar))
            {
                kSolverRowData[i] += kChar;
            }
        }
    }
    
    for (var i = 0; i < kValidChars.length; ++i)
    {
        const kChar         = kValidChars[i];
        kSolverInputData[i] = {};
        kSolverInputData[i]["min"] = 0;
        kSolverInputData[i]["max"] = kSolverRowData.length - 1;
        if (kChar == "=")
        {
            kSolverInputData[i]["min"] = 1;
            kSolverInputData[i]["max"] = 1;
        }
        else if (kValidOperators.includes(kChar))
        {
            if (!kValidNumbersWithSign.includes(kChar))
            {
                --kSolverInputData[i]["max"];
            }
        }
    }
}

function selectNode(node)
{
    if (kSelectedNode != null)
    {
        kSelectedNode.classList.remove("selectedNode");
    }

    kSelectedNode = node;
    kSelectedNode.classList.add("selectedNode");
}

function toggleNode(node)
{
    const nIndex = kCurrentRow.indexOf(node);
    const kChar  = node.childNodes[0].textContent;
    if ((kSolverRowData[nIndex].length == 1) &&
        (kSolverRowData[nIndex] == kChar))
    {
        return;
    }

    if (node.classList.contains(E_NODE_POSITION_UNKNOWN))
    {
        node.classList.replace(E_NODE_POSITION_UNKNOWN, E_NODE_POSITION_UNUSED);
    }
    else if (node.classList.contains(E_NODE_INVALID))
    {
        node.classList.replace(E_NODE_INVALID, E_NODE_POSITION_UNUSED);
    }
    else if (node.classList.contains(E_NODE_POSITION_UNUSED))
    {
        node.classList.replace(E_NODE_POSITION_UNUSED, E_NODE_POSITION_USED);
    }
    else if (node.classList.contains(E_NODE_POSITION_USED))
    {
        node.classList.replace(E_NODE_POSITION_USED, E_NODE_POSITION_CORRECT);
    }
    else if (node.classList.contains(E_NODE_POSITION_CORRECT))
    {
        node.classList.replace(E_NODE_POSITION_CORRECT, E_NODE_POSITION_UNUSED);
    }
}

function registerKeypress(key, override=false)
{
    if (E_ENTERING_EXPRESSION == eState)
    {
        switch (key)
        {
            case "ArrowLeft":
            {
                const nCurrentIndex = kCurrentRow.indexOf(kSelectedNode);
                if (nCurrentIndex > 0)
                {
                    selectNode(kCurrentRow[nCurrentIndex - 1]);
                }
            } break;

            case "ArrowRight":
            {
                const nCurrentIndex = kCurrentRow.indexOf(kSelectedNode);
                if (nCurrentIndex < (kCurrentRow.length-1))
                {
                    selectNode(kCurrentRow[nCurrentIndex + 1]);
                }
            } break;

            case "Copy":
            {
                // If the entry is all blank, we're using the suggestion
                for (var i = 0; i < kCurrentRow.length; ++i)
                {
                    kCurrentRow[i].childNodes[0].textContent = kSuggestions[i].childNodes[0].textContent;
                    kCurrentRow[i].classList.remove(E_NODE_INVALID);
                    kCurrentRow[i].classList.add(E_NODE_POSITION_UNKNOWN);
                }
                kVirtualKeyboardCommands[0].textContent = "Enter";
            } break;

            case "Enter":
            {
                if (processExpression())
                {
                    for (var i = 0; i < kCurrentRow.length; ++i)
                    {
                        kCurrentRow[i].classList.remove("selectedNode");
                    }
                    eState = E_ENTERING_FEEDBACK;
                    kMessagesTextNode.textContent = "Perfect, enter this suggestion into Nerdle, then keep tapping on each entry until they're colored exactly the same as they were in Nerdle... then press Enter to accept."
                    kDimming.classList.add(E_DIMMED);

                    for (var i = 0; i < kCurrentRow.length; ++i)
                    {
                        if ((kSolverRowData[i].length == 1) &&
                            (kSolverRowData[i] == kCurrentRow[i].childNodes[0].textContent))
                        {
                            kCurrentRow[i].classList.remove(E_NODE_POSITION_UNKNOWN);
                            kCurrentRow[i].classList.add(E_NODE_POSITION_CORRECT);
                        }
                    }
                }
            } break;

            case "Backspace":
            {
                registerKeypress(" ", true);
                registerKeypress("ArrowLeft");
                registerKeypress(" ", true);

                var bAllBlank = true;
                for (var i = 0; bAllBlank && (i < kCurrentRow.length); ++i)
                {
                    bAllBlank = kCurrentRow[i].childNodes[0].textContent == " ";
                }
                
                if (bAllBlank)
                {
                    kVirtualKeyboardCommands[0].textContent = "Copy";
                }
            } break;

            default:
            {
                if (override || (kValidChars.indexOf(key) != -1))
                {
                    kSelectedNode.textContent = key;
                    kSelectedNode.classList.remove(E_NODE_INVALID);
                    kSelectedNode.classList.add(E_NODE_POSITION_UNKNOWN);
                    kVirtualKeyboardCommands[0].textContent = "Enter";

                    if (!override)
                    {
                        const nCurrentIndex = kCurrentRow.indexOf(kSelectedNode);
                        if (nCurrentIndex >= 0 && nCurrentIndex < (kCurrentRow.length-1))
                        {
                            selectNode(kCurrentRow[nCurrentIndex + 1]);
                        }
                    }
                }
            } break;
        }
    }
    else
    {
        if ("Enter" == key)
        {
            if (processResult())
            {
                var bWinState = true;
                for (var i = 0; i < kCurrentRow.length; ++i)
                {
                    kCurrentRow[i].removeEventListener("click", clickFunction);
                    if (!kCurrentRow[i].classList.contains(E_NODE_POSITION_CORRECT))
                    {
                        bWinState = false;
                    }
                }

                if (bWinState)
                {
                    kMessagesTextNode.textContent = "Winner!";
                    eState = E_WINNER;
                }
                else
                {
                    // Create the Next Row
                    kCurrentRow = addRow(kBodyRoot, "        ", clickFunction, true);
                    kAllRows.push(kCurrentRow);
                    selectNode(kCurrentRow[0]);

                    kMessagesTextNode.textContent = "Please enter an equation to check, or just press Enter whilst blank to accept the suggestion";
                    eState = E_ENTERING_EXPRESSION;
                    kDimming.classList.remove(E_DIMMED);
                    kVirtualKeyboardCommands[0].textContent = "Copy";

                    // Update the Suggestion
                    kNewSuggestion = generateNewSuggestion();
                    for (var i = 0; i < kSuggestions.length; ++i)
                    {
                        kSuggestions[i].childNodes[0].textContent = kNewSuggestion[i];
                    }
                }
            }
        }
    }
}

function clickFunction(e)
{
    var caller = e.target || e.srcElement;
    if (E_ENTERING_EXPRESSION == eState)
    {
        selectNode(caller);
    }
    else
    {
        toggleNode(caller);
    }
}

function keypressFunction(e)
{
    var caller = e.target || e.srcElement;
    if (E_ENTERING_EXPRESSION == eState)
    {
        if (kSelectedNode != null)
        {
            if (e.key == "Enter")
            {
                registerKeypress(kVirtualKeyboardCommands[0].textContent);
            }
            else
            {
                registerKeypress(e.key);
            }
        }
    }
    else
    {
        registerKeypress(e.key);
    }
}

function virtualKeyboardFunction(e)
{
    var caller = e.target || e.srcElement;
    if (E_ENTERING_EXPRESSION == eState)
    {
        switch (caller.childNodes[0].textContent)
        {
            case "Delete":
            {
                registerKeypress("Backspace");
            } break;

            default:
            {
                registerKeypress(caller.childNodes[0].textContent);
            } break;
        }
    }
    else
    {
        registerKeypress(caller.childNodes[0].textContent);
    }
}

function clickSuggestionFunction(e)
{
    if (E_ENTERING_EXPRESSION == eState)
    {
        var caller = e.target || e.srcElement;
        var nSuggestionId = kSuggestions.indexOf(caller)
        kCurrentRow[nSuggestionId].childNodes[0].textContent = caller.childNodes[0].textContent
    }
}
