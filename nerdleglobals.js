const   kValidOperators             = "+-*/=";
const   kValidNumbers               = "0123456789";
const   kValidNumbersWithSign       = kValidNumbers + "+-";
const   kValidChars                 = kValidNumbers + kValidOperators;

// Solver Solutions
const   E_SOLUTION_GOOD             = "E_SOLUTION_GOOD";
const   E_SOLUTION_OK               = "E_SOLUTION_OK";
const   E_SOLUTION_NAFF             = "E_SOLUTION_NAFF";

// Solver Phases
const   E_ENTERING_EXPRESSION       = "E_ENTERING_EXPRESSION";
const   E_ENTERING_FEEDBACK         = "E_ENTERING_FEEDBACK";
const   E_WINNER                    = "E_WINNER";

// Node States
const   E_NODE_POSITION_CORRECT     = "nodePositionCorrect";
const   E_NODE_POSITION_USED        = "nodePositionUsed";
const   E_NODE_POSITION_UNUSED      = "nodePositionUnused";
const   E_NODE_POSITION_UNKNOWN     = "nodePositionUnknown";
const   E_NODE_INVALID              = "nodeInvalid";

// Dimmer
const   E_DIMMED                    = "dimmed";

var     eState                      = E_ENTERING_EXPRESSION;

var     kBodyRoot                   = null;
var     kMainEntry                  = null;
var     kColourEntry                = null;
var     kSuggestionRoot             = null;
var     kSuggestions                = null;
var     kAllRows                    = [];
var     kSelectedNode               = null;
var     kCurrentRow                 = null;
var     kIssuesTextNode             = null;
var     kExpression                 = "";
var     kVirtuakKeyboardNumbers     = null;
var     kVirtuakKeyboardOperators   = null;
var     kVirtualKeyboardCommands    = null;

var     kSolverRowData              = [];
var     kSolverInputData            = [];

if (!String.prototype.includes)
{
    String.prototype.includes = function(kString)
    {
        return -1 != this.indexOf(kString);
    }
}
if (!DOMTokenList.prototype.replace)
{
    DOMTokenList.prototype.replace = function(kRemove, kAdd)
    {
        this.remove(kRemove);
        this.add(kRemove);
    }
}