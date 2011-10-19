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
/*!	jQuery Hover Menu Plugin
 * 	Support for displaying a submenu on hover
 * 	@author: nicolasrudas
 *	@copyright: (c) Nicolas Rudas
 *	@license: MIT Licence
 *
 *	Usage: $('li').hoverMenu(options);
 */
jQuery.fn.hoverMenu = function(o) {
	var options = $.extend({
		show: function(){
			return $(this).fadeIn();
		},
		hide: function(){
			return $(this).fadeOut();
		},
		timeout: 300
	}, (o || {}));
	
	return this.mouseover(function() {
		var $this = $(this),
			list = $this.data('list') || $this.children('ol,ul');
		
		list.length
			&& options.show.apply(list[0])
			&& $this.data('list',list)
			&& $this.data('hover',true);	
	
	}).mouseout(function() {
		var $this = $(this),
			list = $this.data('list') || $this.children('ol,ul');
		
		list.length
			&& setTimeout(function(){
				!$this.data('hover') && options.hide.apply(list[0]);
				},options.timeout)
			&& $this.data('hover',false);		
	});
};


/*!	jQuery Placeholder plugin
 * 	Support for placeholder attribure in input elements
 *	for non-HTML5 enabled browsers
 * 	@author: nicolasrudas
 *	@copyright: (c) Nicolas Rudas
 *	@license: MIT Licence
 *	@date: 14 Feb. 2011
 *
 *	Usage: $('input[placeholder]').placeholder(options);
 */
jQuery.fn.placeholder = function(o) {
	var options = $.extend({
	//	what to do if browser supports HTML5 placeholder attribute
	//	if true, the script is not executed. if false, the script executes as usual
		ignore_supported: true,
 	//	class added to input when placeholder text is shown
		placeholder_class: 'placeholder',
		label: function(label){
		//	What do to with the label, if any
		//	eg. $(label).hide();
		}
	},o||{});
	
	return this.each(function() {
		var $this = $(this),
			id = $this.attr('id'),
			label = $('label[for='+id+']').eq(0),
			placeholder = $this.attr('placeholder') || label.text() ;		
	
		if ('placeholder' in document.createElement('input')){
		//	Browser supports HTML5 placeholder attribute			
			if (options.ignore_supported){ this._placeholder_ignore = true; return; }
			else {
			//	Rely on script for placeholder functionality
			//	and avoid conflicts with default browser behaviour
				$this.attr('placeholder',''); }
		}
		this._placeholder_ignore = false;
		this._placeholder = placeholder;
		this._placeholder_class = options.placeholder_class || '';						
		label.length && $.isFunction(options.label) && options.label.apply(this,[ label[0] ]);		
	})	
	.live('focus.placeholder',function() {
		var $this = $(this),
			val = $this.val();
		
		!this._placeholder_ignore && this._placeholder && this._placeholder == val
			&& $this.val('') && $this.removeClass(this._placeholder_class);
	})
	.live('blur.placeholder',function() {
		var $this = $(this),
			val = $this.val();
		
		!this._placeholder_ignore && this._placeholder && (!val || val == this._placeholder)
			&& ($this.val( this._placeholder ) && $this.addClass(this._placeholder_class))
			|| $this.removeClass(this._placeholder_class);
	})
	.trigger('blur.placeholder');
};
