
/*
 * Loading Spinner Animation
 */
function addLodingSpinner(uniqueDivId) {
	return function() {
		$("#" + uniqueDivId).append("<div class=\"up-loadingSpinner\"> \
										<img src=\"img/loadingspinner.gif\"></img> \
									</div>");
	};
}

function removeLoadingSpinner(uniqueDivId) {
	return function() {
		$("#" + uniqueDivId).children().first().remove();
	}
}

/*
 * Retreive authorization token
 */
function getAuthHeader() {
	return "Bearer c06156e119040a27a4b43fa933f130";
}

/*
 * hashCode function for String
 * see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/ for details
 */
String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

/*
 * Use underscore.string functions from underscore library
 */
_.mixin(_.string.exports());

/*
 * Template Loading Functions
 */
function rendertmpl(tmpl_name) {
    if ( !rendertmpl.tmpl_cache ) { 
    	rendertmpl.tmpl_cache = {};
    }

    if ( ! rendertmpl.tmpl_cache[tmpl_name] ) {
        var tmpl_dir = 'js/templates';
        var tmpl_url = tmpl_dir + '/' + tmpl_name + '.tmpl';

        var tmpl_string;
        $.ajax({
            url: tmpl_url,
            method: 'GET',
            dataType: 'html',
            async: false,
            success: function(data) {
                tmpl_string = data;
            }
        });

		tmpl_string = removeTabs(tmpl_string);
		rendertmpl.tmpl_cache[tmpl_name] = _.template(tmpl_string);
                
    }

    return rendertmpl.tmpl_cache[tmpl_name];
}

function removeTabs(tmpl) {
	return tmpl.replace(/\t/g, '');
}
