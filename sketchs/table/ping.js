var ping = (function () {
  function request_image(url) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() { resolve(img); };
      img.onerror = function() { reject(url); };
      img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
    });
  }

  function ping(url) {
    return new Promise(function(resolve, reject) {
      var start = (new Date()).getTime();
      var response = function() { 
        var delta = ((new Date()).getTime() - start);
        resolve(delta); 
      };
      request_image(url).then(response).catch(response);
      
      // Set a timeout for max-pings, 1s.
      setTimeout(function() { reject(Error('Timeout')); }, (MAX_PING_TIME||1000) );
    });
  }
    
  return ping;
})();