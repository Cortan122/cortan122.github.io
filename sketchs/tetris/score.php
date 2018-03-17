<?php  
$post = json_decode(file_get_contents('php://input'));
$str = file_get_contents('scoreboard.json');
if (strlen($str) == 0) {
  $str = '{}';
}
$data = json_decode($str);
if ( property_exists($data,$post[0])) {
  $cat = $data->{$post[0]};
	if ( property_exists($cat,$post[1])) {
    $arr = $cat->{$post[1]};
    if(gettype($arr) != "array"){
      $arr = array(0 => $arr,1 => json_decode('{"v":0,"f":0}'));
    }
    if($arr[0]->v < $post[2]->v){
      $arr[0] = $post[2];
    }
    if($arr[1]->f < $post[2]->f){
      $arr[1] = $post[2];
    }
    $cat->{$post[1]} = $arr;
  }else{
    $cat->{$post[1]} = $post[2];
  }
}else{
  $cat = new stdClass();
  $cat->{$post[1]} = $post[2];
}
$data->{$post[0]} = $cat;
$txt = json_encode($data); 
//echo $txt;
$writer = fopen("scoreboard.json", "w");
fwrite($writer, $txt);
fclose($writer);
?>