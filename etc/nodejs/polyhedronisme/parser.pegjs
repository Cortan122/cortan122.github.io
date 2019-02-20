/* series of opspecs */
start  = opspec+

/* opspec one of:
 A  - single letter
 A3 - single letter and float
 B(5,4.3,3) - function call format w. float args
*/
opspec =
  lett:opcode args:opargs {return {"op":lett,"args":args};}/
  lett:opcode float:float  {return {"op":lett,"args":[float]};}/
  lett:opcode              {return {"op":lett,"args":[]};}

/*
parentheses surrounding comma-delimited list of floats i.e.
( 1 , 3.2, 4 ) or (1) or (2,3)
*/
opargs = "(" num:( float:float ","? {return float} )+")" {return num;}

/* just a letter */
opcode = op:[a-zA-Z] {return op;}

/* standard numerical types */
int   = digits:[0-9-]+   { return parseInt(digits.join(""), 10);  }
float = digits:[0-9.-]+  { return parseFloat(digits.join(""), 10); }
