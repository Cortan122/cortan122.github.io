<?php
function recursion($a)
{
  //echo "Q".$a."Q";
  if ($handle = opendir($a)) {

    /* This is the correct way to loop over the directory. */
    while (false !== ($entry = readdir($handle))) {
      //echo "A". $entry ."\n";
      if (is_dir($a ."/".$entry) and $entry != '.' and $entry != '..'){
        //echo "R".$entry . "\n";
        recursion(($a ."/". $entry));
      }
      if($entry == 'index.html' or $entry == 'index.php'){
        echo $a ."/"."\n";
      }
    }

    closedir($handle);
  }
}

recursion('.');
?>