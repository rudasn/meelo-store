var console = (function(undefined) {
	var m = ['log', 'error', 'info', 'warn', 'time','timeEnd', 'dir'];
	if(typeof window.console === undefined) {
		var c = {}, f = function() {};
		for (var i=0; i < m.length; i++) {
			c[m[i]] = f;
		};
		return c;
	}
	return window.console;
})();            

// need to preserve sort option when
//  filtering (it does!), pushing ..
// 

(function() {
    var store = meelo.Store(data),
        container = $('#container'),
        parent = container.parent();
    
    $('#q').bind('keyup', function() {
        store.publish('search', this);        
    });
    
    $('a.sort-by').live('click', function() {
        var already_sorted = this.className.match(/sort\-by\-active/gmi),
            attr = $(this).attr('rel');
        
        $('.sort-by-active').removeClass('sort-by-active');
        
        !already_sorted && $(this).addClass('sort-by-active');
        
        store.publish('sort', already_sorted ? '-'+attr : attr );
        return false;
    });
    
    $('input').live('blur',function() {

        var name = $(this).attr('name'),
            val = $(this).val();
        
        if(!name){ return; }
        
        var id = $(this).parents('tr').attr('id').split('-')[1],
            item = store.filter({'id': parseInt(id,10)}),
            changed = {};
        
        changed[name] = ( !isNaN(parseInt(val,10)) ) ?
            parseInt(val,10) :
            val;

        item.update(changed);
        
    });

    // "bind" attaches an event to each of the store's items
    // init is a built-in event called when an item is created
    store.bind('init', function() {
    // "this" is the item
        var dom_id = 'item-'+this.id;
        
        this._html = ''+
            '<tr id="'+dom_id+'">' +
            '<td>'+this.id+'</td>' +
            '<td><input type="text" name="name" class="name-value"' +   
                'value="'+this.name+'"></td>' +
            '<td><input type="text" name="surname" class="surname-value"' +   
                'value="'+this.surname+'"></td>' +
            '<td><input type="text" name="sex" class="sex-value"' +   
                'value="'+this.sex+'"></td>' +
            '<td><input name="age" type="number" class="age-value"' +
                'value="'+this.age+'"></td>' +
            '<td>'+this.email+'</td>' +
            '<td>'+this.url+'</td>' +
            '<td>'+this.favourite_animals.join(', ')+'</td>' +
            '<td>'+this.lucky_numbers.join(', ')+'</td>' +
            '</tr>' +
            '';
        
        this._get_dom = function() {
            return $('#item-'+this.id, container);
        };
    });
    
    store.bind('update', function(changes) {
        return;
        var d = this._get_dom();
        for(var c in changes) {
            $('.'+ c + '-value', d ).val( changes[c].to );
        }

    });
    
    store.listen('search', function(el) {
        var self = $(el);
        
        el._timer && clearTimeout(el._timer);        
        
        if(!self.val()) {        
            container.remove();
            //store.publish('show');
            container.children().show();
             self.removeClass('loading');
             container.appendTo(parent);
            return;
        }
        
        this._timer = setTimeout(function() {
            self.addClass('loading');
            setTimeout(check,0);
        }, 500);
        
        function check(){
            var val = self.val();
            container.remove();
            
            console.time('search+display');
            store.publish('hide');
            
            console.time('search');
            var results = store.filter({
                'name__icontains': val
            }, {
                'surname__icontains': val                
            },{
                'age': parseInt(val,10)
            });
            console.timeEnd('search');
            
            results.publish('show');
            console.timeEnd('search+display');
            
            self.removeClass('loading');
            
            container.appendTo(parent);
            
        }
        
    });
    
    store.listen('hide', function() {
   //     container.remove();
        container.children().hide();
        return;
        this.each(function(item) {
       //     item._get_dom().hide();
        });
        
     //   container.appendTo( parent );
    });
    
    store.listen('show', function() {
      //  container.remove();
        
        this.each(function(item) {
          item._get_dom().show();
        });
        
      //  container.appendTo( parent );
    });
    
    store.listen('sort', function(key) {
       console.time('sort');
       
       this.sort(key);
       
    //   var f = container.children(':last');
        var items = this.items(),
            length = items.length;
                
        innerHTML();
        
    //    
     //   appendTo();
      //  
        console.timeEnd('sort');
        
        function innerHTML(){
            console.time('innerHTML');
            var s ='';
            var d = document.createElement('div');
            var b = container[0];

            for (var i=0; i < length; i++) {
                var item = items[i];          
                var dom = document.getElementById( 'item-' + item.id );                
               var c = d.cloneNode(false);
               c.appendChild( dom );
                s += c.innerHTML;
            };
            b.innerHTML = s;
            console.timeEnd('innerHTML');
        }        
        function appendTo(){
            console.time('appendTo')
            container.remove();
            var b = container[0];
            for (var i=0; i < length; i++) {
                 var item = items[i];
                 var dom = item._get_dom()[0];
                 dom && b.appendChild( dom );
            }
            parent.append(container);
            console.timeEnd('appendTo');
        }
        function insertBefore(){
            console.time('insertBefore')
            container.remove();
            
            var b = container[0],
                first = b.children[0];
            for (var i=0; i < length; i++) {
                 var item = items[i];
                 var dom = item._get_dom()[0];
                 dom && b.insertBefore( dom, first );
            }
            arent.append(container);
            console.timeEnd('insertBefore')
        }
    });
    
    store.listen('beforeChange', function(event_name, changed_data) {
        console.info('before', arguments);
        console.time('CHANGE');
        if(event_name == 'push') {
            container.remove();
        }
    });

    store.listen('change', function(event_name, changed_data) {
        console.info('after', arguments);
        console.time(event_name +' '+ changed_data.length + ' items');
        
        if(event_name == 'push') {
           var html = '';           
           for (var i=0; i < changed_data.length; i++) {
               var item = data[i];
               html += item._html;             
           };
           
           container.append(html);
           
           parent.append(container);        

        }
        console.timeEnd(event_name +' '+ changed_data.length + ' items');        
        console.timeEnd('CHANGE');

    });
    
    store.publish('sort', 'id');
    
    window.store = store;
})();