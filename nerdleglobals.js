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