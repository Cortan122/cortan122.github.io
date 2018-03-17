<?php
$a = '.';
$r = json_decode("{}");

if ($handle = opendir($a)) {

  /* This is the correct way to loop over the directory. */
  while (false !== ($entry = readdir($handle))) {
    if ($entry != '.' and $entry != '..' and is_dir($a ."/".$entry)){
      if (file_exists($a ."/".$entry."/data.json")){
        $r->{$entry} = json_decode(file_get_contents($a ."/".$entry."/data.json"));
      }else if(file_exists($a ."/".$entry."/index.html") or file_exists($a ."/".$entry."/index.php")){
        $r->{$entry} = json_decode("{}");
      }
    }
  }

  closedir($handle);
}

$s = json_encode($r,JSON_PRETTY_PRINT);

$myfile = fopen("categories.txt", "w") or die("Unable to open file!");
fwrite($myfile, $s);
fclose($myfile);

echo $s;
?>