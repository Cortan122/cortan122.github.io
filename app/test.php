<?php
/*
$myfile = fopen("data.txt", "a") or die("Unable to open file!");
$txt = "John Doe \n";
fwrite($myfile, $txt);

fclose($myfile);

echo readfile("data.txt");
echo $_POST[];
*/
$post = file_get_contents('php://input');
echo $post;

$myfile = fopen("data.txt", "a") or die("Unable to open file!");
$txt = $post;

fwrite($myfile, $txt);
fwrite($myfile, '\n');

fclose($myfile);
?>
