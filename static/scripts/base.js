$(function() {
    
    $('#datastr').text( JSON.stringify(data) );
	
	$('.exec, .cmd').each(function() {
	    var t = $(this).text().replace(/^var\b/,''),
	        result = eval( t );
	    
	    console.log( $(this).text().replace(/\s+/g,' ') );
	    
	    if (this.className.match(/cmd/)) {
	        console.log('=> ',  result )
            console.log('-------------------------------------');
            $(this).after('<br><span> // => '+ result +'</span>')
        }
	});
});
