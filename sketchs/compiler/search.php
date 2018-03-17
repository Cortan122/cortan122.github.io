<?php
$post = "/fakeCode";//file_get_contents('php://input');
$arr = scandir(getcwd() . $post); //or die("Unable to open directory!");
foreach ($arr as &$value) {
   echo $value;
   echo "\r\n";
}
?>