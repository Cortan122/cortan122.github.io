(fun1)((fun1)rec_fun())();//original
//call:@  (calls are done first)
//cast:$
(fun1)$((fun1)$rec_fun@())$();
(fun1)$((fun1)$rec_fun@())@();//corect (but why?)
(fun1)@((fun1)$rec_fun@())@();