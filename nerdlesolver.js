function parseIntegerWithUnary(kExpression, eSolutionType)
{
    // parseInt cannot cope with anything other than a unary -
    // So collapse them manually
    var bPositive    = true;
    var nFirstNumber = -1;

    if ((E_SOLUTION_NAFF != eSolutionType) && (kExpression[0] == "+"))
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
            if ((E_SOLUTION_NAFF != eSolutionType) && (i > 1))
            {
                return NaN;
            }
            nFirstNumber = i;
        }
    }

    const kAbsoluteValue = kExpression.substr(nFirstNumber);
    if (E_SOLUTION_NAFF != eSolutionType)
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

function parseExpressionList(kExpressionList, eSolutionType)
{
    const kOrderOfPrecedence = ["*/","+-"];
    while (kExpressionList.length > 1)
    {
        const nSanityCheck = kExpressionList.length;
        for (var i = 0; i < kOrderOfPrecedence.length; ++i)
        {
            while (kExpressionList.length > 1)
            {
                var kOperator = null;
                for (var j = 0; j < kExpressionList.length; ++j)
                {
                    if (kOrderOfPrecedence[i].includes(kExpressionList[j]))
                    {
                        kOperator = kExpressionList[j];
                        break;
                    }
                }
    
                if (null == kOperator)
                {
                    break;
                }

                const nOperatorIndex = kExpressionList.indexOf(kOperator);

                if (E_SOLUTION_GOOD == eSolutionType)
                {
                    if ((kExpressionList[nOperatorIndex-1] == 0) &&
                        (kExpressionList[nOperatorIndex+1] == 0))
                    {
                        return NaN;
                    }
                }
    
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
                        if (0 == kExpressionList[nOperatorIndex+1])
                        {
                            return NaN;
                        }

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
            }
        }

        if (nSanityCheck == kExpressionList.length)
        {
            return NaN;
        }
    }

    return kExpressionList[0];
}

function parseExpression(kExpression, nOffset, eSolutionType, bRenderError, bAllowExpression)
{
    if (undefined == nOffset)
    {
        nOffset = 0;
    }
    if (undefined == eSolutionType)
    {
        eSolutionType = E_SOLUTION_NAFF;
    }
    if (undefined == bRenderError)
    {
        bRenderError = true;
    }
    if (undefined == bAllowExpression)
    {
        bAllowExpression = true;
    }

    // Convert the Expression into an array of values and operators
    // Note: We'll resolve unaries at this stage to stop this being
    //       an absolute headache
    var kExpressionList = [];
    var bAnyNumberFound = false;
    var kValidityString = kValidNumbersWithSign;
    var kCurrent        = "";
    
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
            const nValue = parseIntegerWithUnary(kCurrent, eSolutionType);
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
    
    const nValue = parseIntegerWithUnary(kCurrent, eSolutionType);
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

    const nResult = parseExpressionList(kExpressionList, eSolutionType);
    if (isNaN(nResult))
    {
        return [false, 0];
    }

    return [true, nResult];
}

function processExpression()
{
    var bValid                  = true;
    kIssuesTextNode.textContent = "No Issues";
    kExpression                    = "";

    // By default, everything is valid
    for (var i = 0; i < kCurrentRow.length; ++i)
    {
        kCurrentRow[i].classList.remove(E_NODE_INVALID);
        kCurrentRow[i].classList.add(E_NODE_POSITION_UNKNOWN);
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

function generateNewSuggestionRecursive(kString, eSolutionType)
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

        const kLeftSide  = parseExpression(kLeftSideExpression,  0, eSolutionType, false, true);
        const kRightSide = parseExpression(kRightSideExpression, 0, eSolutionType, false, false);

        if (kLeftSide[0] && kRightSide[0] && (kLeftSide[1] == kRightSide[1]))
        {
            return [true, kString];
        }

        return [false, ""];
    }

    // Create a custom order based on data we've not seen yet
    var kSolverLeastUsed = [];
    for (var i = 0; i < kSolverRowData[nLength].length; ++i)
    {
        const kChar      = kSolverRowData[nLength][i];
        const nCharIndex = kValidChars.indexOf(kChar);
        const nCharCount = countString(kString, kChar);

        if ((0 == nCharCount) &&
            (0 == kSolverInputData[nCharIndex]["min"]) &&
            (nCharCount < kSolverInputData[nCharIndex]["max"]))
        {
            kSolverLeastUsed.push(kChar);
        }
    }

    for (var i = 0; i < kSolverRowData[nLength].length; ++i)
    {
        const kChar      = kSolverRowData[nLength][i];
        if (!kSolverLeastUsed.includes(kChar))
        {
            const nCharIndex = kValidChars.indexOf(kChar);
            const nCharCount = countString(kString, kChar);
            if (nCharCount < kSolverInputData[nCharIndex]["max"])
            {
                kSolverLeastUsed.push(kChar);
            }
        }
    }

    for (var i = 0; i < kSolverLeastUsed.length; ++i)
    {
        const kChar      = kSolverLeastUsed[i];
        const nCharIndex = kValidChars.indexOf(kChar);
        const kResult = generateNewSuggestionRecursive(kString + kChar, eSolutionType);
        if (kResult[0])
        {
            return kResult;
        }
    }

    return [false, ""];
}

function generateNewSuggestion()
{
    var kResult = generateNewSuggestionRecursive("", E_SOLUTION_GOOD);
    if (kResult[0])
    {
        return kResult[1];
    }
    else
    {
        kResult = generateNewSuggestionRecursive("", E_SOLUTION_OK);
        if (kResult[0])
        {
            return kResult[1];
        }
        else
        {
            kResult = generateNewSuggestionRecursive("", E_SOLUTION_NAFF);
            if (kResult[0])
            {
                return kResult[1];
            }
        }
    }

    kIssuesTextNode.textContent = "Failed to find a suggestion... double check you coloured everything correctly, and if so, maybe raise an issue on the Github page and a link/description/screenshot of the puzzle?";
    return "0+12/3=4";
}
