<?php
$post = "/fakeCode";//file_get_contents('php://input');
$arr = scandir(getcwd() . $post); //or die("Unable to open directory!");

foreach ($arr as &$value) {
  echo $value;
  echo "\r\n";
}

$s = ob_get_contents();
$myfile = fopen("search.txt", "w") or die("Unable to open file!");
fwrite($myfile, $s);
fclose($myfile);

?>