/*****************************************************************************
 * meelo-store
 * 
 * @date		$Date: 2011-10-19
 * @author		$Author: rudas.n $
 * @copy		(c) Copyright 2011 Nicolas Rudas
 * @licence		MIT Licensed
 * @latest		https://github.com/rudasn/meelo-store/
 * 
 *****************************************************************************/

;(function() {
	var debug = false
		, window = this
		, console = (function() {
			var m = ['log', 'error', 'info', 'warn', 'time','timeEnd', 'dir'];
			if(typeof window.console === 'undefined') {
				var c = {};
				for (var i=0; i < m.length; i++) {
					c[m[i]] = function() {};
				};
				return c;
			}
			return window.console;
		})()
		, rand = function() {
			return parseInt((new Date().valueOf()+Math.floor(Math.random()*new Date().valueOf()))/(Math.floor(Math.random()*9)+1),10);
		}
		, log = function() {
            debug && console.log( Array.prototype.slice.apply(arguments,[0]) );
		}
		, time = function(name,args) {
			if(!debug){return;}
			var self = time;
			self.timers = self.timers || {};
			self.timers[name] =  {
				time : new Date().valueOf()
				, args : args
			};
		}
		, timeEnd = function(name,args) {
			if(!debug){return;}
			var self = time;
			self.timers = self.timers || {};
			args = (args) ?  ' (' + args +')' : '';
			var timeargs = (self.timers[name].args) ? ': ' + self.timers[name].args : ''
				, time_passed = name + timeargs +'\n\t'+(new Date().valueOf() - self.timers[name].time)/1000;
	
			console.log(time_passed + args);
		
			self.timers[name] = {};
		};
	
	var meelo = window.meelo = window.meelo || {};
	
	var Store = window.meelo.Store = function(data, opts, exts) {
		return new Store.item.__init__(data,opts,exts);
	};
		
	Store.item = {
	//	Initialise a storage item
	//	Data must be an array (of objects, key/value pairs)
		__init__ : function(data, opts) {
			var self = this;
			
			data = data || [];
					
			this.__id__ = rand(); // Assign a unique ID - not actually used, but could (filter caching etc)
			
			this.data = {
				items: []
			};
			this.url = null;
			this.__initialised__ = false; // =CHECK
			this.__ready__ = false; // true if ready event was fired
			this.__loaded__ = false; // true if load event was fired
			
		//	Used for .end method
		//	returns the "parent" object
			this.prevObj = opts && opts.store
			                ? opts
			                : data && data.__store__
			                    ? data.__store__
			                    : null;
		
		//	Flag this object as a Store object
			this.store = true;
		
		//	Search results have selector attr
		//	which gets passed the search inputs (what was the search for)
			this.selector = null;
					
		//	Inherit properties
			this.properties = {
				callbacks: {
					init: []
					, update: []
					, ready: []
				//	etc
				}
				, instance_callbacks: {
					init: []
					, update: []
					, ready: []
				//	etc
				}
				, callback_queue: {}
			};
						
			if ( this.prevObj ) {
				_utils.extend(this.properties, this.prevObj.properties);
			}
			else if (opts && opts.constructor === Object) {
				_utils.extend(this.properties, opts);
			}
			else if (opts){
				log('Invalid: Second argument must be an object with options');
			}
			
		//	Some callbacks must only be executed once: ???
		//	init, ready		//				
		//	this.properties.callbacks.init = [];
		//	console.error(this.__id__)
		//	this.properties.callbacks.ready = [];
		//	this.properties.instance_callbacks.init = [];
			
			this.items = function() {
				return this.data.items;
			};
			
			this.length = function() {
				return this.data.items.length;
			};
						
		//	Set data
			if(typeof data === 'string') {
				this.url = data;				
			}
			else {
				this.push(data, Boolean(this.prevObj));
			}
						
			return this;
		
		}
		, __load__: function(url){
		//	=TODO
		
			if (!this.url && !url){return this;}
		
			var self = this
				, complete = function(response, status) {
					var args = Array.prototype.slice.apply(arguments);
					
				//	self.__loaded__ = true;
					
				//	status == 'success' && response
				//		? self.push(response)
				//		: log('Error requesting ' + self.url, 'Response: ', response);
					
					self.__dispatch__('callbacks', 'load', args);
				}
				;
			
			this.url = url || this.url;
			
			this.__xhr__
				&& this.__xhr__.abort();
			
			this.__xhr__ = jQuery.ajax({
				url: this.url
				, type: 'get'
				, dataType: 'json'
				, success: function(response, status) {
				//	complete(response, status);
					complete.apply(this, Array.prototype.slice.apply(arguments));
				}
				, error: function(response, status){
					complete.apply(this, Array.prototype.slice.apply(arguments));
				}
			});
			
			return this;
		}
		, __ready__: function(response, status) {
		//	=CHECK
			var args = [ response, status ];
			this
				.publish('ready', args);
			
			return this;		
		}
	
	//	Utils
		, reload: function(url){
		//	=TODO
			this.data = {};
			return this.load((url || this.url));
		}
		, end: function(){ // OK!
			return this.prevObj || Store([]);
		}
		, root : function() { // OK!
		//	=CHECK - when is this needed?
			var r = this;
		
			do { r = r.end(); }
			while(r.end().length());
		
			return r;
		}
		
	//	Events
		, __attach__: function(type, name, callback){
			var self = this
			    , callbacks = this.properties[type] = this.properties[type] || {}
			    , init = this.__initialised__
                , queue = this.properties.callback_queue[ type+':'+name ]
                ;
            
            callbacks[name] = callbacks[name] || [];
			
			log('attach', type, name);
		
		//  Save this callback to list
			typeof callback == 'function'
				? callbacks[name].push(callback)
				: log('Error', 'Second parameter must be a function');
        
        //  Init event on Store objects fires asap
            if (type == 'callbacks' && name == 'init') {
			    callback.apply(self);
			}
		
		//  Apparently the user fired this event
		//  before attaching it. Fire those now
			else if (queue && queue.length) {
			    for (var i=0; i < queue.length; i++) {
			        self.__dispatch__(type, name, queue[i]);
			    };
			    delete this.properties.callback_queue[ type+':'+name ];
			}
        
        //  Ready and load events have special treament
			else {			
    			this.length() && name == 'ready' && ((this.url && this.__loaded__) || !this.url)
    				&& self.__dispatch__(type, name);
			
    			name == 'load'
    				&& !this.__xhr__ && this.__load__();		    
			}
			
			
			return this;			
		}
		, __dispatch__: function(type, name, args){
			var self = this
				, callbacks = this.properties[type] || {}				
				, list = callbacks[name] || []
				, r
				, items
				;
			
			if (args && args.constructor !== Array){
			    args = [ args ];
			}	
			
			log('dispatch', type, name, args, list.length);
		
		//  Trying to fire an event that was not attached
		//  Save it and fire on whenever it is attached
		//  except: init and ready events on Store objects
			if (!list.length && !(type == 'callbacks' && (name == 'init' || name == 'ready'))){
			    this.properties.callback_queue[ type+':'+name ] = this.properties.callback_queue[ type+':'+name ] || [];
			    this.properties.callback_queue[ type+':'+name ].push( args || [] );
			    return this;
			}
			
		
		//  These events apply to the Store's items
		//  where "this" is the item (object)
			if(type == 'instance_callbacks') {
			
			//  Some events apply only to certain items.
			//  init, change =TODO
			//  First argument must be an array
			//  of Objects! => [ [ objects ], "other", "data", "here" ]
				if ( (name === 'init' || name == 'update')
				    && args
				    && args.length >= 1) {
				    				    
				    _utils.each(args[0],function(item) {
				        __call__(item, args.slice(1));
				    });
				    
				}
				
			//  Most events apply to all items in the Store	
				else {				
				    this.each(function(item,i) {
    					__call__(item);
    				});			    
			    }
			    
		//  These events apply to the Store		
		//  where "this" is the Store
			} else {
			    
			    if (name == 'init') {
			        this.__initialised__ = true;
			    }
    			
    			else if (name === 'ready') {
    			    this.__ready__  = true;
    			}
                
                __call__(this);               
			    
			}

			return this;
			
			function __call__(t,a){
			    var r;
			    a = a || args;
				for (var i=0; i < list.length; i++) {				    
					r = list[i].apply(t, a);
				    
					if (r && name === 'load') {
						this.__loaded__ = true;
						self.push(r);
					}
					if(r === false) {
						break;
					}
				};
				
			}
			
		}

		, init: function(callback){
		//  Helper method for attaching to or triggering
		//  the Store's init event
			callback
				? this.__attach__('callbacks', 'init', callback)
				: this.__dispatch__('callbacks', 'init');
			
			return this;
		}
		, ready: function(callback){
		//  Helper method for attaching to or triggering
		//  the Store's ready event
			callback
				? this.__attach__('callbacks', 'ready', callback)
				: this.__dispatch__('callbacks', 'ready');			
			return this;

		}
		, load: function(callback){
		//  Helper method for attaching to or triggering
		//  the Store's load event
			callback
				? this.__attach__('callbacks', 'load', callback)
				: this.__dispatch__('callbacks', 'load');
			
			return this;
		}
		
		, listen: function(name, callback){
		//  Attach event on the Store
			return this.__attach__('callbacks', name, callback);			
		}
		, publish: function(name, args){
		//  Trigger event on the Store
			return this.__dispatch__('callbacks', name, args);
		}
		
		, bind: function(name, callback){
		//  Attach event on the Store's items
			return this.__attach__('instance_callbacks', name, callback);			
		}
		, trigger: function(name, args){
		//  Trigger event on the Store's items
			return this.__dispatch__('instance_callbacks', name, args);
		}

	//	Data
	//	These methods return new Store objects
	
		, eq: function(index){ // OK!
		//	Returns a single item according to its index
		//	index:		Number
		//	returns:	new Store
			var t = this.data.items[(index||0)] || {};

			return Store([t], this);
		}
		, get: function(search_obj){
		//	return a single result
		    var ret = this.filter.apply(this, Array.prototype.slice.apply(arguments, [0]) );		    
		    return ret.length() ? ret.items()[0] : null;
		}
		, slice : function(start, end) {
		//	@start	 	Number
		//	@end	 	Number
		//	usage		Store.slice(10,20)
		//	returns 	new Store	
			
			var items = this.items();
			
			return Store(Array.prototype.slice.apply(items, arguments), this);
		}
		, filter: function() {
		//	Find specific items from the dataset that match the criteria provided
		//	------------------------------------------------------------------
		//	returns 	new Store
		//	usage 		Store.filter({ "name": "Nicolas" })
        //              - name == "Nicolas"
		//				Store.filter({ "name": "Nicolas" }, { "name": "Rudas" })
        //              - name == "Nicolas" || name == "Rudas"
		//				Store.filter({ "name": "Nicolas", "surname": "Rudas" }, { "name": "Rudas" })
        //              - (name == "Nicolas" && surname == "Rudas") || name == "Rudas" 
		//	------------------------------------------------------------------
			var self = this
				, _return
				, searchFor = Array.prototype.slice.apply(arguments)
				, items = self.data.items
				, utils = _utils
				, helpers = utils.filter.helpers
				, helpers_keys = (function() {
					var r = [];
					for(var h in helpers){
						r.push(h);
					}
					return r;
				})()
				;
						
		// Convert search values from ('key','value') to ({ key : value })
			if(searchFor.length == 2
				&& typeof searchFor[0] === 'string' 
				&& typeof searchFor[1] !== 'undefined'
			){
				var k = searchFor[0]
					, v = searchFor[1];
					
				searchFor = {};
				searchFor[k] = v;
				searchFor = [searchFor];
			}		
		
			time('FIND');
		
		//  Translate helper syntax to helper functions
		//  eg. make age__gt get items of age greater than..
			(function apply_helpers(o){
				var r = [];
				
				utils.each(o, function(item, k) {
					if (typeof k === 'string') {
						var helper
							, reg = new RegExp( '__('+ helpers_keys.join('|') +')$' )
							, clear_name = k.replace(reg,'')
							, uses_helper = k.match( reg );						

						if(uses_helper){
								
							uses_helper = uses_helper[1];
					
							helper = helpers[uses_helper];
					
							o[clear_name] = helper(item);
							
							delete o[k];
						}

					}
					
					if (typeof item === 'object') {
						apply_helpers(item);
					}
						
					r.push(item);
				});
				
				return r;
			})(searchFor);
			
			log('Filter:',searchFor);
			
        //  Apply each filter to the store's items
			_return = utils.map(searchFor, function(item) {
				return _utils.filter(item, items) || [];
			});

			timeEnd('FIND',_return.length + ' items, incl. duplicates');
			
			_return = Store(_return, this);
			
			_return.selector = searchFor;
			
			return _return;
		}
	
	//	CRUD	
		, push: function(newdata, data_existed) {
		//	Insert data into dataset
		//	------------------------------------------------------------------
		//	@newdata	Object | Array (of objects) | Store
		//	returns		Store
		//	usage	Store.push({ "hello": "World!" })
		//			Store.push([{ "hello": "World!" }, { "hello": "World" }])
		//	------------------------------------------------------------------
			var self = this
			    , data
				, current_data = this.data.items = this.data.items || []
				;
			
		// Push objects of array	
			if(newdata.constructor == Array && newdata.length) {
				data = newdata;
			}		
		
		// Push objects from Store object
			else if(newdata.constructor == Object && newdata.store && newdata.data.items ) {
				data = newdata.data.items;
			}
		
		// Push an object
			else if (newdata.constructor == Object) {
				data = [ newdata ];
		 	}
			else {
				return this;
			}
			            
			!data_existed
			    && this.trigger('init', [ data ])
                ;
		     
			if(data){
			    !data_existed
			        && this.publish('beforeChange', ['push', data]);
			    
				this.data.items = current_data.concat(data);
                
                !data_existed
			        &&  this.publish('change', ['push', data ] );
			}

			data && !data_existed && !this.__ready__
				&& this.publish('ready', [ data ] );        
            
			return this;
		
		}
		, insert: function(obj){return this.push(obj);}
		, update: function(what){
		//	Updates all the items in the dataset with the values provided
		//	------------------------------------------------------------------
		//	@what		Object
		//	returns		Store
		//	usage		Store.update({ "hello": "World :)" })
		//	------------------------------------------------------------------		
			if(!this.length()){return this;}
			
			var self = this
				, updateIndex
				, args = Array.prototype.slice.apply(arguments);
		
		// Convert values from ('key','value') to ({ key : value })
			if(args.length == 2
				&& typeof args[0] == 'string' && typeof args[1] !== 'undefined'
				&& _utils.filter(args[1].constructor,[ String, Number, RegExp ])
			){
				var k = args[0]
					, v = args[1];
				
				what = {};
				what[k] = v;
			}
		
			var keys = 0; // remove this
		    
			this.publish('beforeChange', ['update', this.items()]);
		    
			time('Update');
			
			var changed_items = [];
			
			this.each(function(item, index) {
				var changed_data = {}
					, has_changed 
					;
				
				for(var key in what) {
					
					if(item[key] === what[key]) {continue;}					
					
					var storedValue = item[key]
						, newValue = what[key];
					
					has_changed = true;
					
					keys++; // remove this
				
					newValue = (newValue.constructor === Function)
									? newValue(storedValue)
									: ( newValue.constructor === RegExp && storedValue.constructor === String )
										? storedValue.match(newValue)
										: newValue;
				
					item[key] = newValue;
					
					changed_data[key] = {
						'from': storedValue || 'none'
						, 'to': newValue
					};
					
					changed_items.push(item);
					
				};
				
				
				has_changed
				    && self.trigger('update', [ [ item ], changed_data ] )
				    ;
				
			});
			
			timeEnd('Update',this.length()+' record(s), '+keys+' attribute(s)');
			
			this.publish('change', ['update', changed_items]);
						
			return this;
		}
		, remove: function(){
		//	Removes all the items from all associated stores
		//	------------------------------------------------------------------
		//	returns		Store (empty)
		//	usage		Store.find({'hello': 'World'}).remove();
		//	------------------------------------------------------------------
			this.publish('beforeChange', ['remove', items ]);

			time('Remove');
			
			var self = this
			    , parent = this.end()
			    , items = this.items()
			    ;
					
		// Mark each item as to be deleted	
			this.each(function(item,i) {
				item.__delete__ = true;
			});
		    
			while(parent && parent.length()) {
			    parent.each(function(item, index) {
    				if(item.__delete__) {
                        this.data.items.splice(index,1);
    					Store(item).trigger('delete',[[item]]);    					
    				}			        
			    });
			    parent = parent.end();
			};
		
			timeEnd('Remove');
			
			this.publish('change', ['remove', items ]);
			
			this.data.items = [];
					
			return this;
		}
		, merge: function(newdata, check){
		//	Merge current data with new data
		//	=> treat each data item as a unique entity
		//	and keep only those which are unique
		//	Check argument determines which items to keep and which to discard
		//  This is quite slow for large data sets
		// ---------------------------------------------------
		//	@newdata	Array | Store
		//	@check		Function(current_item, new_item) or String (object key)
		// ---------------------------------------------------		    
		    //debug
		      //  &&
		        console.time('Merge');

		    var keys = (typeof check === 'string')
			            ? Array.prototype.slice.apply(arguments,[1])
			            : null			    
		        , current_data = this.items()
		        ;
		        
		    newdata = (newdata && newdata.store)
        			      ? newdata.items()
        			      : newdata;

            check = (typeof check == 'function')
		            ? check
		            : function (o1, o2){
                        for (var i in o1) {
                            if( (keys && keys.indexOf(i) === -1)
                                || !o1.hasOwnProperty(i)){
                                    continue;
                            }					
                            if (o1[i] !== o2[i]) {return null;}
                            }

                            return true;
                    }
		    ;
		    
		    this.length()
		        && this.each(function(item) {
        		        for (var i = newdata.length - 1; i >= 0; i--){
            		        var new_item = newdata[i]
            		            , c = check(item, new_item)
            		            ;                    
                            if(c) {
                                newdata.splice(i, 1);
                            }		            
        		        };
        		    });
		    
		    this.push(newdata);
		    
		    //debug
		      //  &&
		        console.timeEnd('Merge');
		    
			return this;
		}
    
    //  Helpers
	    , print: function(key,template){ // =BETTER
			key = key || this.keys();
			var r;
			
		// Simple print	
			if(key.constructor === String || key.constructor === Array) {
				key = (key.constructor === Array) ? key : [key];
	
			//	If no template provided, just join data with a coma	
				template = template || (function() {
					return _utils.map(key,function(item,index) {
						return '$'+(index+1);
					},function(r) {
						return r.reverse().join(', '); });
				})();
	
			//	Apply template to data
			//	Each key can be referred to by using $number,
			//	where number is the key's index in the array (key param)
				this.each(function(item,index) {
					var r = template;
					for (var i = key.length - 1; i >= 0; i--){
						r = r.replace( new RegExp( '\\$' + (i + 1) , 'g') ,item[key[i]] || '');
					};
					return r.replace(/\$0/g,index + 1);
				},function(items){ r=items.reverse(); });
				
			}
			
			return r;
		}
		, each: function(fn,fn2){ 
		//	Iterates over and calls the provided callbacks on each item in the dataset
		//	------------------------------------------------------------------
		//	@fn			Function(item)
		//	@fn2		Function(item)
		//	returns		Store
		//	------------------------------------------------------------------
			fn = (typeof fn == 'function') ? fn : false;
		
			if(!fn || !this.data.items){
				return this;}
			
			return _utils.each.apply(this,[this.data.items,fn,fn2]);
		}	
		, map: function(fn,fn2){
			fn = (typeof fn == 'function') ? fn : false;
		
			if(!fn || !this.data.items){
				return this;}
			
			return _utils.map.apply(this,[this.data.items,fn,fn2]);
		}
	};
		
	Store.item.__init__.prototype = Store.item;
	
	var _utils = Store.utils = {
	// ** RegExp helpers **
		regexp: {
			escape: function(s) {
				s = s || ''; return s.toString().replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
			}
		}
		, filter: function(what, where) {
			var searchForProperty = [];
			
			var sameArrays = function(arr,arr1) {
				var al = arr.length
					, bl = arr1.length
					, ret = null
					, m = match
					;
				
				if (al !== bl || al === 0 || bl === 0) { return null; }
				
				for (var i = al - 1; i >= 0; i--){
					if(!arr.hasOwnProperty(i) || !arr1.hasOwnProperty(i)){continue;}
					if (m(arr[i], arr1[i]) == null) { return null; }
				}
				return arr1;
			};

			var sameObjects = function(obj,obj1) {
			//	log('same objects', obj, obj1);
				var r = obj1
					, m = match
					;
				
				for (var i in obj) {
					if(!obj.hasOwnProperty(i)){continue;}
					if (m(obj[i],obj1[i]) == null) {return null;}
				}
				
			//	log('MATCHED same objects', obj, obj1);
				
				return obj1;
			};

			var inArray = function(value,obj) {
				var r = []
					, m = match;

				for (var i = obj.length - 1; i >= 0; i--){
					if(!obj.hasOwnProperty(i)){continue;}
					var item = obj[i];
					if( m(value,item) !== null) {
						r.push( item );
					}
				};

				return (r.length) ? r : null ;
			};

			var inObject = function(value,obj) {
			//	log('in object', value, obj);

				var r = []
					, m = match
					;

				for(var i in obj){
					if(!obj.hasOwnProperty(i)){continue;}
					
					var item = obj[i];
					
				//	log('in object check', value, item);

					if( m(value, item) !== null ) {
						r.push( item );
					}
				};
				return (r.length) ? r : null ;
			};

			var inString = function(value, string) {
				var	valueConstructor = value.constructor;
				
			//	log('in string', value, string);
				
				if( valueConstructor === RegExp) {
					return (value.test(string)) ? string : null ; }

				else if( valueConstructor === Function && value(string) === true ) {
					return string;
				}
				
			//	else if ( string.toString().match( new RegExp(value.toString(),'gmi') ) ) {
			//		return string;
			//	}
				return null;
			};
			
			var match = function(a, b) {
			//	log('match', a, b);
				
				var ret;
				
				if(typeof a === 'undefined' || typeof b === 'undefined' || a === null || b === null) {
					return null; }

				if (a === b) {
					return b; }

				var	vc = a.constructor,
					oc = b.constructor;

			// Cannot compare array or object to a string or a number
				if( (vc === Array || vc === Object) && (oc === String || oc === Number) ) {
					return null;
				}
				
				if(vc === String && oc === Object && b[a]) {
					console.warn('sfp');
					searchForProperty.push(b);
					return b;
				}
				
				if( oc === Array ) {
					if (vc === Array) {
						ret = sameArrays(a,b);
					}
					else {
						ret = inArray(a,b);
					}
				}
				else if( oc === Object ) {
					if (vc === Object) {
						ret = sameObjects(a,b);
					}
					else {
						ret = inObject(a,b);
					}
				}
				else if (oc === String || oc === Number){
					ret = inString(a,b);
				}
				
			//	console.warn(ret)
				
				return ret !== null ? ret : null;				
			};
			
			if(typeof what === 'string') {
				match(what, where);
				console.warn('=>',searchForProperty);
				return searchForProperty;
			} else {
				return match(what,where);
			}
		}		
	// ** Map ** 
	// Applies callback function for each element in the object passed,
	// and returns object of values that this function returned
	// If function returns FALSE or UNDEFINED, those values are not included
	// in returned object
		, map: function(obj, fn, fn2){
			var fn_return = []
				, result;
		
			if(obj.constructor === Array) {
				for (var i=0; i < obj.length; i++) {
					result = fn.apply(this,[obj[i],i]);
					
					if(result === false || typeof result === 'undefined'){ continue; }
					
					if(result.constructor === Array) {
						fn_return = fn_return.concat(result);
					}
					else {
						fn_return.push(result);
					}
				};
			}
			
			else if(obj.constructor === Object) {
				for(var i in obj) {
					result = fn.apply(this,[obj[i],i]);
					
					if(result === false || typeof result === 'undefined'){ continue; }
					
					if(result.constructor === Array) {
						fn_return = fn_return.concat(result);
					}
					else {
						fn_return.push(result);
					}
				}
			} else {
				throw 'Store.map: First argument must be Array or Object.';
			}
			
			if(fn2){
				return fn2.apply(this,[fn_return]);
			}
		
			return fn_return;
			
		}	
	// ** Each ** 
	// Applies callback function for each element in the object passed,
	// and returns object of values that this function returned
	// If function returns FALSE loop is terminated and results returned;
		, each : function(obj, fn, fn2) {
			var fn_return = []
				, result;
		
			if(obj && obj.constructor === Array) {
				for (var i=0; i < obj.length; i++) {
					
					result = fn.apply(this,[obj[i],i]);
					
					if(result === false){ break; }
					
					fn_return.push(result);
				};
			}
			else {
				for(var i in obj) {
					result = fn.apply(this,[obj[i],i]);
					if(result === false){ break; }
					fn_return.push(result);
				};
			}	

			if(fn2){
				return fn2.apply(this,[fn_return]);
			}
		
			return fn_return;
		}
	
	// jQuery extend
		, extend : function() {
			// copy reference to target object
			var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;
			
			var _extend = this.extend;
						
			// Handle a deep copy situation
			if ( typeof target === "boolean" ) {
				deep = target;
				target = arguments[1] || {};
				// skip the boolean and the target
				i = 2;
			}

			// Handle case when target is a string or something (possible in deep copy)
			if ( typeof target !== "object" && typeof target !== 'function' )
				target = {};

			// extend jQuery itself if only one argument is passed
			if ( length == i ) {
				target = this;
				--i;
			}

			for ( ; i < length; i++ )
				// Only deal with non-null/undefined values
				if ( (options = arguments[ i ]) != null )
					// Extend the base object
					for ( var name in options ) {
						var src = target[ name ], copy = options[ name ];

						// Prevent never-ending loop
						if ( target === copy )
							continue;

						// Recurse if we're merging object values
						if ( deep && copy && typeof copy === "object"  )
							target[ name ] = _extend( deep, 
								// Never move original objects, clone them
								src || ( copy.length != null ? [ ] : { } )
							, copy );

						// Don't bring in undefined values
						else if ( copy !== undefined )
							target[ name ] = copy;

					}

			// Return the modified object
			return target;
		}	
	    , unique: function(existing_data, new_data, check) {
	    	var keys = (typeof check === 'string')
			            ? Array.prototype.slice.apply(arguments,[2])
			            : null
			    , all_data = [].concat([].concat(existing_data).concat(new_data))
			    , new_data_true = []
			    ;
			check = (typeof check == 'function')
		            ? check
		            : (keys)
		                ?   function (o1, o2){                
                				for (var i in o1) {
                				    if( keys.indexOf(i) == -1 || !o1.hasOwnProperty(i)){
                				        continue;
                				    }					
                					if (o1[i] !== o2[i]) {return null;}
                				}
			
                				return true;
                            }
		                : function() {}; 
			    
			
            console.warn(existing_data, new_data, check);
            
            return unique(all_data); ///, new_data_true ];
		    
			function unique(array) {
                var r = [],
                    d = [];
                o:for(var i = 0, n = array.length; i < n; i++)
                {
                	for(var x = 0, y = r.length; x < y; x++)
                	{
                		if( check(r[x],array[i]) )
                		{
                            console.warn('exists', array[i]);
                			continue o;
                		}
                		else {
                            console.warn('new', array[i]);
                		    d.push( array[i] );
                		}
                	}
                	r[r.length] = array[i];
                }
                return [r, d];
            }
            
    
	    }
	    
	};	
	
//	Find helpers
//	Must return true or false
	Store.utils.filter.helpers = {
	//	=TODO: Dates!
		not: function(what) {
			return function(value) {
				if(what.constructor !== RegExp) {
					what = what.toString();
					what = new RegExp('^'+_utils.regexp.escape(what)+'$' );
				}
				
				return (what.test(value)) ? false : true;
			};			
		}
		, iexact: function(what) {
			return function(value){
				what = _utils.regexp.escape(what);
				var match = value.toString().match( new RegExp('^'+what+'$', 'gmi') );
				return match ? true : false  ;
			};
		}
		, icontains: function(what){
			return function(value) {
				what = _utils.regexp.escape(what);
				var match = value.toString().match( new RegExp(what,'gmi') );
				return match ? true : false;
			};
		}
		, contains: function(what){
			return function(value) {
				what = _utils.regexp.escape(what);
				var match = value.toString().match( new RegExp(what,'gm') );
				return match ? true : false;
			};
		}
		, isnull: function(pass) {
			return function(value) {
				// =TODO
			};
		}
		, gt: function(than) {
			return function(value) {
				return value > than;
			};
		}
		, gte: function(than) {
			return function(value) {
				return value >= than;
			};
		}
		, lt: function(than) {
			return function(value) {
				return value < than;
			};
		}
		, lte: function(than) {
			return function(value) {
				return value <= than;
			};
		}
		, range: function(range) {
			var start = range[0]
				, end = range[1]
				;
			return function(value) {
				return (value >= start && value <= end); 
			};
		}		
	};
	
})();

// =============================
// = Some additional functions =
// =============================
meelo.Store.item.last = function(howmany) {
	howmany = parseInt(howmany,10) || 1;
	var start = (howmany>this.data.items.length) ? 0 : howmany;
	return Store(Array.prototype.slice.apply(this.data.items, [(start - howmany)] ));
};
meelo.Store.item.sort = function(key) {
//  Sort the items of the store by the provided key or function
//  ------------------------------------------------------------
//  @key        String | Function(a,b)
//  returns     Store
//  ------------------------------------------------------------
//  To reverse sort use "-" before the key, eg. store.sort('-id')
	var r = this.items()
	    , fn = typeof key === 'function'
	    , reversed = (!fn && key.match(/^\-/)) ? true : false;
	
	key = reversed ? key.replace(/^\-/,'') : key;
	
	!fn
    	? r.sort(function(a,b) {
    		return b[key] > a[key];
    	})
    	: r.sort(fn);
	
	reversed && r.reverse();
	
	return this;
};
/*
 * Returns all keys found in data, once each 
 * Good for building an index with unique keys
 */
meelo.Store.item.keys = function() {
	var r = [];
	this.each(function(item,index) {
		for (var key in item) {
			if( !r.join('\n').match( new RegExp('^'+Store.utils.regexp.escape(key)+'$','m') ) ) {
				r.push(key); } };
	});
	return r;
};
/*
 * Returns all values (string) for the specified key, once each 
 * Good for building an index with unique values
 * =TODO
 * Return the store's data but only including
 * the keys provided
 * returns an array of objects
 */
meelo.Store.item.values = function(key) {
	var r =[];
	return Store.utils.map(this.data.items,function(item,index) {
		var value = item[key];
		if ( !r.join('\n').match( new RegExp('^'+Store.utils.regexp.escape(value)+'$','m') )  ) {
			r.push(value);
			return value ;
		}
	},function(r) { return r.reverse(); });
};
/*
 * Returns all values for the specified key, once each 
 * Good for building an index with unique values
 */
meelo.Store.item.valuesObj = function(key) {
	var r =[];
	return Store.utils.map(this.data.items,function(item,index) {
		var value = item[key];
		value = (value && value.name) ? value.name : value;
		if ( !r.join('\n').match( new RegExp('^'+Store.utils.regexp.escape(value)+'$','m') )  ) {
			r.push(value);
			return item[key] ;
		}
	},function(r) { return r.reverse(); });
};
/*
 * Returns all values for the specified key,
 * which are found more than once
 * Good for checking for duplicates by specifying a
 * (should be) unique key
 */
meelo.Store.item.duplicates = function(key) {
	var i = {},r = [];
		
	this.each(function(item) {
		var v = item[key];
		if(typeof v === 'undefined' || (typeof v != 'string' && typeof v != 'number')) { return; }
		i[v] = i[v] || 0;
		i[v]++;
	});
	
	for(var n in i){if (i[n] > 1) { r.push(n); }};	
	
	return r;
};