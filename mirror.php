<?php
function startsWith($haystack, $needle){
  $length = strlen($needle);
  return (substr($haystack, 0, $length) === $needle);
}

$post = file_get_contents('php://input');
if(startsWith($post,'http://')){
  $homepage = file_get_contents($post);
}else{
  $homepage = file_get_contents('http://'.$post);
}
echo $homepage;
?>