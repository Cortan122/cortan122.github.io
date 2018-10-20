eval_str = "eval";
eval = global[eval_str];
Function_str = "(a,b)=>Function(a,b)";
Function = eval(Function_str);
mult_args = "a,b";
mult_boby = "return a*b";
mult = Function(mult_args,mult_boby);
env = getenv();
return env;