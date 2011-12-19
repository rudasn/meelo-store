var data = (function() {
    // a function to generate large amount of random data
    var count = 999
        , properties = [
        //    ['property_name', type, [ array_type, array_length ] ]
              [ 'name', String ]
            , [ 'surname', String ]
            , [ 'email', String ]
            , [ 'url', String ]
            , [ 'age', Number, 20, 40 ]
            , [ 'sex', String ]
            , [ 'favourite_animals', Array, String, 3 ]
            , [ 'lucky_numbers', Array, Number, 8 ]
        ]
        , data = [{
            'name': 'Nicolas'
            , 'surname': 'Rudas'
            , 'email': 'jjkldfh@gmail.com'
            , 'url': 'http://www.opfhopjk.com'
            , 'age': 27
            , 'sex': 'male'
            , 'favourite_animals': [ 'dog', 'cat', 'leopard' ]
            , 'lucky_numbers': [ 3, 6, 12 ]
            , 'id': 999
        }]
        , samples = {
            'favourite_animals': [
                'dog'
                , 'cat'
                , 'parrot'
                , 'donkey'
                , 'horse'
                , 'crocodile'
                , 'hippo'
                , 'hamster'
                , 'leopard'
                , 'lion'
                , 'giraffe'
            ]
            , 'sex': [
                'female'
                , 'male'
                , 'other'
            ]
            
        }
        ;
    
    for (var i=0; i < count; i++) {
        var d = {
            id: i
        };
        
        for (var p = properties.length - 1; p >= 0; p--){
            var prop = properties[p]
                , name = prop[0]
                , type = prop[1]
                , subtype = prop[2]
                , subtype_length = prop[3]
                , value
                ;
            
            
            if (type === String || type === Number) {                
                if(samples[name])  {
                    value = samples[name][ (Math.floor(Math.random() * samples[name].length)) ];
                }
                else {
                    if ( typeof subtype === 'number' && typeof subtype_length === 'number') {
                        value = Math.floor(Math.random() * (subtype_length - subtype + 1) + subtype);
                    }
                    else {                
                        value = rand(type);
                        
                        if (name === 'url') {
                            value = 'http://www.' + value + '.com';
                        }
                        else if (name === 'email') {
                            value += '@gmail.com';
                        }
                        else if (name.match(/name/gi)) {
                            value = value[0].toUpperCase() + value.split('').slice(1).join('');
                        }
                    }
                }
            }
            
            else if (type == Array) {
                value = [];
                for (var t = subtype_length - 1; t >= 0; t--){
                    value.push( (samples[name])
                                    ? samples[name][(Math.floor(Math.random() * samples[name].length))]
                                    : rand( subtype ) );
                };
            }
            
            d[name] = value;
            
        };
        data.push(d);
    };
    
    function rand(type){
        var txt = 'abcdefghijklmnopqrstuvwxyz'
            , nums = '0123456789'
            , d = (type == Number) ? nums : txt
            , length = Math.floor(Math.random() * (12 - 6 + 1) + 6),
            r = '';
        
        for( var i=0; i < length; i++ )
            r += d.charAt(Math.floor(Math.random() * d.length));

        return (type == Number) ? parseInt(r, 10) : r;
    }
    return data;
})(); 