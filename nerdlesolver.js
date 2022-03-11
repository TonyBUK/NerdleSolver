
const   kValidOperators             = "+-*/=";
const   kValidNumbers               = "0123456789";
const   kValidNumbersWithSign       = kValidNumbers + "+-";
const   kValidChars                 = kValidNumbers + kValidOperators;

// Solver Phases
const   E_ENTERING_EXPRESSION       = Symbol("E_ENTERING_EXPRESSION");
const   E_ENTERING_FEEDBACK         = Symbol("E_ENTERING_FEEDBACK");
const   E_WINNER                    = Symbol("E_WINNER");

// Node States
const   E_NODE_POSITION_CORRECT     = "nodePositionCorrect";
const   E_NODE_POSITION_USED        = "nodePositionUsed";
const   E_NODE_POSITION_UNUSED      = "nodePositionUnused";
const   E_NODE_POSITION_UNKNOWN     = "nodePositionUnknown";
const   E_NODE_INVALID              = "nodeInvalid";

var     eState                      = E_ENTERING_EXPRESSION;

var     kBodyRoot                   = null;
var     kSuggestionRoot             = null;
var     kSuggestions                = null;
var     kAllRows                    = [];
var     kSelectedNode               = null;
var     kCurrentRow                 = null;
var     kIssuesTextNode             = null;
var     kExpression                 = "";
var     kVirtuakKeyboardNumbers     = null;
var     kVirtuakKeyboardOperators   = null;

var     kSolverRowData              = [];
var     kSolverInputData            = [];

function addRow(kBodyRoot, kText, listenerFunction, bSetUnknown=false)
{
    rowNodes = [];

    kRowRootNode = document.createElement("tr");
    
    for (var i = 0; i < kText.length; ++i)
    {
        rowNodes[i] = document.createElement("td");
        if (kText[i] == '\n')
        {
            rowNodes[i].appendChild(document.createTextNode("Enter"));
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
    
    // Create the First Row
    kCurrentRow = addRow(kBodyRoot, "        ", clickFunction, true);
    kAllRows.push(kCurrentRow);
    selectNode(kCurrentRow[0]);

    // Root of the Keyboard Table
    kVirtuakKeyboardNumbers   = addRow(document.getElementById("keyboardRow1"), kValidNumbers,   virtualKeyboardFunction, true);
    kVirtuakKeyboardOperators = addRow(document.getElementById("keyboardRow2"), kValidOperators, virtualKeyboardFunction, true);
    addRow(document.getElementById("keyboardRow3"), "\n\b", virtualKeyboardFunction, true);

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
            } break;

            default:
            {
                if (override || (kValidChars.indexOf(key) != -1))
                {
                    kSelectedNode.textContent = key;
                    kSelectedNode.classList.remove(E_NODE_INVALID);
                    kSelectedNode.classList.add(E_NODE_POSITION_UNKNOWN);

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
            registerKeypress(e.key);
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

function parseIntegerWithUnary(kExpression, bStrict)
{
    // parseInt cannot cope with anything other than a unary -
    // So collapse them manually
    var bPositive    = true;
    var nFirstNumber = -1;

    if (bStrict && (kExpression[0] == "+"))
    {
        return NaN;
    }

    for (var i = 0; (nFirstNumber == -1) && (i < kExpression.length); ++i)
    {
        const kChar = kExpression.charAt(i);
        if (kChar == "-")
        {
            bPositive = !bPositive;
        }
        else if (kValidNumbers.includes(kChar))
        {
            if (bStrict && (i > 1))
            {
                return NaN;
            }
            nFirstNumber = i;
        }
    }

    const kAbsoluteValue = kExpression.substr(nFirstNumber);
    if (bStrict)
    {
        if ((kAbsoluteValue.length > 1) && (kAbsoluteValue[0] == "0"))
        {
            return NaN;
        }
        else if ((nFirstNumber > 0) && (kAbsoluteValue[0] == "0"))
        {
            return NaN;
        }
    }
    
    return (bPositive ? 1 : -1) * parseInt(kAbsoluteValue);
}

function parseExpressionList(kExpressionList)
{
    const kOrderOfPrecedence = "*/+-";
    while (kExpressionList.length > 1)
    {
        const nSanityCheck = kExpressionList.length;
        for (var i = 0; i < kOrderOfPrecedence.length; ++i)
        {
            const kOperator = kOrderOfPrecedence.charAt(i);
            while (kExpressionList.includes(kOperator))
            {
                const nOperatorIndex = kExpressionList.indexOf(kOperator);
                switch (kOperator)
                {
                    case "*":
                    {
                        kExpressionList[nOperatorIndex] = kExpressionList[nOperatorIndex-1] *
                                                            kExpressionList[nOperatorIndex+1];
                        kExpressionList.splice(nOperatorIndex+1, 1);
                        kExpressionList.splice(nOperatorIndex-1, 1);
                    } break;

                    case "/":
                    {
                        kExpressionList[nOperatorIndex] = kExpressionList[nOperatorIndex-1] /
                                                            kExpressionList[nOperatorIndex+1];
                        kExpressionList.splice(nOperatorIndex+1, 1);
                        kExpressionList.splice(nOperatorIndex-1, 1);
                    } break;

                    case "+":
                    {
                        kExpressionList[nOperatorIndex] = kExpressionList[nOperatorIndex-1] +
                                                            kExpressionList[nOperatorIndex+1];
                        kExpressionList.splice(nOperatorIndex+1, 1);
                        kExpressionList.splice(nOperatorIndex-1, 1);
                    } break;

                    case "-":
                    {
                        kExpressionList[nOperatorIndex] = kExpressionList[nOperatorIndex-1] -
                                                            kExpressionList[nOperatorIndex+1];
                        kExpressionList.splice(nOperatorIndex+1, 1);
                        kExpressionList.splice(nOperatorIndex-1, 1);
                    } break;
                }
                break;
            }
        }
        if (nSanityCheck == kExpressionList.length)
        {
            alert(kExpressionList);
            break;
        }
    }

    return kExpressionList[0];
}

function parseExpression(kExpression, nOffset=0, bStrict=false, bRenderError=true, bAllowExpression=true)
{
    // Convert the Expression into an array of values and operators
    // Note: We'll resolve unaries at this stage to stop this being
    //       an absolute headache
    var kExpressionList = [];
    var bAnyNumberFound = false;
    var kValidityString = kValidNumbersWithSign;
    var kCurrent        = "";
    var bValid          = true;
    
    for (var i = 0; i < kExpression.length; ++i)
    {
        const kChar = kExpression.charAt(i);

        if (false == bAnyNumberFound)
        {
            if (kValidNumbers.includes(kChar))
            {
                bAnyNumberFound = true;
                kValidityString = kValidNumbers;
            }
        }

        if (kValidityString.includes(kChar))
        {
            kCurrent += kChar;
        }
        else if (bAnyNumberFound)
        {
            const nValue = parseIntegerWithUnary(kCurrent, bStrict);
            if (isNaN(nValue))
            {
                return [false, 0];
            }
            kExpressionList.push(nValue);
            kExpressionList.push(kChar);
            
            kValidityString = kValidNumbersWithSign;
            bAnyNumberFound = false;
            kCurrent        = "";
        }
        else
        {
            if (bRenderError)
            {
                kIssuesTextNode.textContent = "Multiple operators without corresponding values (First error shown in red)";
                kCurrentRow[i+nOffset].classList.add(E_NODE_INVALID);
                kCurrentRow[i+nOffset].classList.remove(E_NODE_POSITION_UNKNOWN);
            }
            return [false, 0];
        }
    }

    if ((kCurrent.length == 0) || !bAnyNumberFound)
    {
        if (bRenderError)
        {
            kIssuesTextNode.textContent = "Expression must end in a number to be valid";
            kCurrentRow[kCurrent.length-1+nOffset].classList.add(E_NODE_INVALID);
            kCurrentRow[kCurrent.length-1+nOffset].classList.remove(E_NODE_POSITION_UNKNOWN);
        }
        return [false, 0];
    }
    
    const nValue = parseIntegerWithUnary(kCurrent, bStrict);
    if (isNaN(nValue))
    {
        return [false, 0];
    }
    kExpressionList.push(nValue);

    if (false == bAllowExpression)
    {
        if (kExpressionList.length != 1)
        {
            return [false, 0]
        }
    }

    return [true, parseExpressionList(kExpressionList)];
}

function processExpression()
{
    var bValid                  = true;
    var bAllBlank               = true;
    kIssuesTextNode.textContent = "No Issues";
    kExpression                    = "";

    // By default, everything is valid
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        kCurrentRow[i].classList.remove(E_NODE_INVALID);
        kCurrentRow[i].classList.add(E_NODE_POSITION_UNKNOWN);
        bAllBlank = bAllBlank && (kCurrentRow[i].childNodes[0].textContent == " ");
    }
    
    // If the entry is all blank, we're using the suggestion
    if (bAllBlank)
    {
        for (var i = 0; i < kCurrentRow.length; ++i)
        {
            kCurrentRow[i].childNodes[0].textContent = kSuggestions[i].childNodes[0].textContent;
        }
    }
    
    //////////////////////////////////////////////////////////////////
    // Simple Test 1
    //
    // Any characters that aren't supposed to be there
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        const kChar = kCurrentRow[i].childNodes[0].textContent;
        if (!kValidChars.includes(kChar))
        {
            kCurrentRow[i].classList.add(E_NODE_INVALID);
            kCurrentRow[i].classList.remove(E_NODE_POSITION_UNKNOWN);
            bValid = false;
        }
        kExpression += kCurrentRow[i].childNodes[0].textContent;
    }

    if (!bValid)
    {
        kIssuesTextNode.textContent = "Incomplete entry (shown in red)";
        return false
    }

    //////////////////////////////////////////////////////////////////
    // Simple Test 2
    //
    // Missing Equals
    if (!kExpression.includes("="))
    {
        kIssuesTextNode.textContent = "No Equality '=' entry";
        return false;
    }

    //////////////////////////////////////////////////////////////////
    // Simple Test 3
    //
    // Multiple Equals
    if (kExpression.split("=").length != 2)
    {
        for (var i = 0; i < kExpression.length; ++i)
        {
            if (kExpression.charAt(i) == "=")
            {
                kCurrentRow[i].classList.add(E_NODE_INVALID);
                kCurrentRow[i].classList.remove(E_NODE_POSITION_UNKNOWN);
            }
        }
        kIssuesTextNode.textContent = "Too many '=' entries";
        return false;
    }
    
    //////////////////////////////////////////////////////////////////
    // Simple Test 4
    //
    // Equals at Beginning or End of Expression
    const nEqualityIndex = kExpression.indexOf("=")
    if ((nEqualityIndex == 0) || (nEqualityIndex == (kCurrentRow.length-1)))
    {
        kIssuesTextNode.textContent = "Invalid position for equality '='";
        kCurrentRow[nEqualityIndex].classList.add(E_NODE_INVALID);
        kCurrentRow[nEqualityIndex].classList.remove(E_NODE_POSITION_UNKNOWN);
        return false;
    }
    
    //////////////////////////////////////////////////////////////////
    // Simple Test 4
    //
    // First character isn't a numeric, unary plus or minus
    if (!kValidNumbersWithSign.includes(kExpression.charAt(0)))
    {
        kIssuesTextNode.textContent = "First character must be one of the following: +, - or a number";
        kCurrentRow[0].classList.add(E_NODE_INVALID);
        kCurrentRow[0].classList.remove(E_NODE_POSITION_UNKNOWN);
        return false;
    }
    
    //////////////////////////////////////////////////////////////////
    // Simple Test 5
    //
    // First after the equality statement isn't a numeric, unary plus or minus
    if (!kValidNumbersWithSign.includes(kExpression.charAt(nEqualityIndex+1)))
    {
        kIssuesTextNode.textContent = "First character after the equals '=' sign must be one of the following: +, - or a number";
        kCurrentRow[nEqualityIndex+1].classList.add(E_NODE_INVALID);
        kCurrentRow[nEqualityIndex+1].classList.remove(E_NODE_POSITION_UNKNOWN);
        return false;
    }
    
    //////////////////////////////////////////////////////////////////
    // Simple Test 6
    //
    // Right Side of the Equality cannot contain an expression
    //
    // Note: This isn't actually true, Nerdles parser actually allows unary stacking
    //       i.e. -+5 which evalues to -5 is allowed.
    //            This is silly, but it's how Nerdle works for now.......
    bValid              = true;
    var bAnyNumberFound = false;
    var kValidityString = kValidNumbersWithSign;
    
    for (var i = nEqualityIndex+1; i < kExpression.length; ++i)
    {
        const kChar = kExpression.charAt(i);
        if (false == bAnyNumberFound)
        {
            if (kValidNumbers.includes(kChar))
            {
                bAnyNumberFound = true;
                kValidityString = kValidNumbers;
            }
        }

        if (!kValidityString.includes(kChar))
        {
            kCurrentRow[i].classList.add(E_NODE_INVALID);
            kCurrentRow[i].classList.remove(E_NODE_POSITION_UNKNOWN);
            bValid = false;
        }
    }

    if (!bValid)
    {
        kIssuesTextNode.textContent = "Right side of the equals '=' cannot contain an expression (operators shown in red)";
        return false;
    }

    //////////////////////////////////////////////////////////////////
    // Non Trivial Test
    //
    // Evaluate the Left/Right Side of the equals statement, and check
    // for validity / equality
    const kResultLeft = parseExpression(kExpression.substr(0, nEqualityIndex), 0);
    if (!kResultLeft[0])
    {
        return false;
    }

    const kResultRight = parseExpression(kExpression.substr(nEqualityIndex+1), nEqualityIndex+1);
    if (!kResultRight[0])
    {
        return false;
    }

    if (kResultLeft[1] != kResultRight[1])
    {
        kCurrentRow[nEqualityIndex].classList.add(E_NODE_INVALID);
        kCurrentRow[nEqualityIndex].classList.remove(E_NODE_POSITION_UNKNOWN);
        kIssuesTextNode.textContent = "Expression is not equals.  Left side = " + kResultLeft[1] + ", Right Side = " + kResultRight[1] + ".";
        return false;
    }
    
    return true;
}

function getStateWeighting(kClassState)
{
    if (E_NODE_POSITION_UNKNOWN == kClassState)
    {
        return 0;
    }
    else if (E_NODE_POSITION_UNUSED == kClassState)
    {
        return 1;
    }
    else if (E_NODE_POSITION_USED == kClassState)
    {
        return 2;
    }
    else if (E_NODE_POSITION_CORRECT == kClassState)
    {
        return 3;
    }
}

function processResultForVirtualKeyboard(kEntries, kCurrentRow, kVirtualKeyboardRow)
{
    for (var i = 0; i < kEntries.length; ++i)
    {
        const kEntry                    = kEntries.charAt(i);
        const kInitialWorstFound        = kVirtualKeyboardRow[i].classList.item(0);
        const nInitialWorstCaseWeight   = getStateWeighting(kInitialWorstFound);
        var   kWorstFound               = kInitialWorstFound;
        var   nWorstCaseWeight          = nInitialWorstCaseWeight;

        for (var j = 0; j < kCurrentRow.length; ++j)
        {
            const kCandidateChar   = kCurrentRow[j].childNodes[0].textContent;
            if (kCandidateChar == kEntry)
            {
                const kCandidate       = kCurrentRow[j].classList.item(0);
                const nCandidateWeight = getStateWeighting(kCandidate);

                if (nCandidateWeight > nWorstCaseWeight)
                {
                    kWorstFound      = kCandidate;
                    nWorstCaseWeight = nCandidateWeight;
                }
            }
        }

        if (nWorstCaseWeight > nInitialWorstCaseWeight)
        {
            kVirtualKeyboardRow[i].classList.replace(kInitialWorstFound, kWorstFound);
        }
    }
}

function processResult()
{
    var bValid = true;
    kIssuesTextNode.textContent = "No Issues";

    // Check for Incomplete Nodes
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        if (kCurrentRow[i].classList.contains(E_NODE_POSITION_UNKNOWN))
        {
            bValid = false;
            kCurrentRow[i].classList.remove(E_NODE_POSITION_UNKNOWN);
            kCurrentRow[i].classList.add(E_NODE_INVALID);
        }
        else if (kCurrentRow[i].classList.contains(E_NODE_INVALID))
        {
            bValid = false;
        }
    }

    if (!bValid)
    {
        kIssuesTextNode.textContent = "Please click on *ALL* entries until they match the Nerdle result (any red entries)";
        return false;
    }

    // Update what we know for the Virtual Keyboard
    processResultForVirtualKeyboard(kValidNumbers,   kCurrentRow, kVirtuakKeyboardNumbers,   kSolverRowData);
    processResultForVirtualKeyboard(kValidOperators, kCurrentRow, kVirtuakKeyboardOperators, kSolverRowData);

    // Gather stats for decision making
    var kCharPositionUsedCount   = [];
    var kCharPositionUnusedCount = [];
    for (var i = 0; i < kValidChars.length; ++i)
    {
        kCharPositionUsedCount[i]   = NaN;
        kCharPositionUnusedCount[i] = NaN;
    }

    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        const kChar  = kCurrentRow[i].childNodes[0].textContent;
        const kState = kCurrentRow[i].classList.item(0);
        const nIndex = kValidChars.indexOf(kChar);
        if (E_NODE_POSITION_UNUSED != kState)
        {
            if (isNaN(kCharPositionUsedCount[nIndex]))
            {
                kCharPositionUsedCount[nIndex] = 0;
            }
            ++kCharPositionUsedCount[nIndex];
        }
        else
        {
            if (isNaN(kCharPositionUnusedCount[nIndex]))
            {
                kCharPositionUnusedCount[nIndex] = 0;
            }
            ++kCharPositionUnusedCount[nIndex];
        }
    }

    // Update the Known Min/Maxes
    for (var i = 0; i < kValidChars.length; ++i)
    {
        if (!isNaN(kCharPositionUnusedCount[i]))
        {
            if (isNaN(kCharPositionUsedCount[i]))
            {
                kSolverInputData[i]["min"] = 0;
                kSolverInputData[i]["max"] = 0;
            }
            else
            {
                kSolverInputData[i]["max"] = kCharPositionUsedCount[i];
            }
        }
        else if (!isNaN(kCharPositionUsedCount[i]))
        {
            if (kSolverInputData[i]["min"] < kCharPositionUsedCount[i])
            {
                kSolverInputData[i]["min"] = kCharPositionUsedCount[i];
            }
        }
    }
    
    // Update what we know for the Solver
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        const kChar  = kCurrentRow[i].childNodes[0].textContent;
        const kState = kCurrentRow[i].classList.item(0);
        const nIndex = kValidChars.indexOf(kChar);

        // If we're correct...
        if (E_NODE_POSITION_CORRECT == kState)
        {
            kSolverRowData[i] = kChar;
            if (kSolverInputData[nIndex]["max"] == 1)
            {
                for (var j = 0; j < kSolverRowData.length; ++j)
                {
                    if (i != j)
                    {
                        kSolverRowData[j] = kSolverRowData[j].replace(kChar, "");
                    }
                }

                // If this is an equals sign, nothing to the right can be an operator
                // anymore...
                if ("=" == kChar)
                {
                    for (var j = i + 1; j < kSolverRowData.length; ++j)
                    {
                        kSolverRowData[j] = kSolverRowData[j].replace("*", "");
                        kSolverRowData[j] = kSolverRowData[j].replace("/", "");
                    }
                }
            }
        }
        else if (E_NODE_POSITION_UNUSED == kState)
        {
            if (kSolverInputData[nIndex]["max"] == 0)
            {
                for (var j = 0; j < kSolverRowData.length; ++j)
                {
                    kSolverRowData[j] = kSolverRowData[j].replace(kChar, "");
                }
            }
        }
        else if (E_NODE_POSITION_USED == kState)
        {
            kSolverRowData[i] = kSolverRowData[i].replace(kChar, "");
        }
    }

    // Determine whether to update the Max's based on the revised list
    // of possible positions
    for (var i = 0; i < kSolverInputData.length; ++i)
    {
        if (kSolverInputData[i]["max"] > 0)
        {
            var nCount = 0;
            for (var j = 0; j < kSolverRowData.length; ++j)
            {
                if (kSolverRowData[j].includes(kValidChars[i]))
                {
                    ++nCount;
                }
            }
            if (nCount < kSolverInputData[i]["max"])
            {
                kSolverInputData[i]["max"] = nCount;
            }
        }
    }
    
    return true;
}

function countString(kString, kChar)
{
    var nCount = 0;
    for (var i = 0; i < kString.length; ++i)
    {
        if (kString[i] == kChar)
        {
            ++nCount;
        }
    }
    return nCount;
}

function generateNewSuggestionRecursive(kString, bStrict)
{
    const nLength = kString.length;

    // Determine if we've completed the solution...
    if (kString.length == kSolverRowData.length)
    {
        const nIndex = kString.indexOf("=");
        for (var i = 0; i < kSolverInputData.length; ++i)
        {
            const nCount = countString(kString, kValidChars[i]);
            if (nCount < kSolverInputData[i]["min"])
            {
                return [false, ""];
            }
        }

        // Parse the Left/Right Side
        const kLeftSideExpression  = kString.substr(0,nIndex);
        const kRightSideExpression = kString.substr(nIndex+1);

        if (bStrict)
        {
            if (kLeftSideExpression.includes("*0"))
            {
                return [false, ""];
            }
            else if (kLeftSideExpression.indexOf("0*") == 0)
            {
                return [false, ""];
            }
        }

        if (kLeftSideExpression.includes("/0"))
        {
            return [false, ""];
        }

        const kLeftSide  = parseExpression(kLeftSideExpression,  0, bStrict, false, true);
        const kRightSide = parseExpression(kRightSideExpression, 0, bStrict, false, false);

        if (kLeftSide[0] && kRightSide[0] && (kLeftSide[1] == kRightSide[1]))
        {
            return [true, kString];
        }

        return [false, ""];
    }

    for (var i = 0; i < kSolverRowData[nLength].length; ++i)
    {
        const kChar      = kSolverRowData[nLength][i];
        const nCharIndex = kValidChars.indexOf(kChar);
        const nCharCount = countString(kString, kChar);

        if (nCharCount < kSolverInputData[nCharIndex]["max"])
        {
            const kResult = generateNewSuggestionRecursive(kString + kChar, bStrict);
            if (kResult[0])
            {
                return kResult;
            }
        }
    }

    return [false, ""];
}

function generateNewSuggestion()
{
    var kResult = generateNewSuggestionRecursive("", true);
    if (kResult[0])
    {
        return kResult[1];
    }
    else
    {
        kResult = generateNewSuggestionRecursive("", false);
        if (kResult[0])
        {
            return kResult[1];
        }
    }

    kIssuesTextNode.textContent = "Failed to find a suggestion... double check you coloured everything correctly, and if so, maybe raise an issue on the Github page and a link/description/screenshot of the puzzle?";
    return "0+12/3=4";
}
