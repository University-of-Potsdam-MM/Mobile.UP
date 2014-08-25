/*
* LocalStorage Klasse
*/
define([], function(){
var LocalStore = {

	get : function(key, empty){ //Objekt aus dem LocaStorage auslesen
		var it = localStorage.getItem(key);
		try {
			it = JSON.parse(it);
		} catch (e) {}
		if(it == undefined) {
			it = empty;
			if(empty != undefined)
				this.set(key, empty);
		}
		return it;
	},
	
	set : function(key, value, itemValue){ //Objekt im LocalStorage speichern
		if(itemValue) { //In einem gespeichert Objekt/Array eine Eigenschaft ändern, value ist dann das Objekt/Array und itemValue der Wert
			var k = value;
			value = this.get(key);
			if(!value)
				value = {};
			value[k] = itemValue;
		}
		localStorage.setItem(key, JSON.stringify(value));
	},
	
	val : function(key, value) { //Gibt den Wert für einen key zurück oder setzt ihn, je nach dem ob value angegeben ist
		if(value)
			localStorage.setItem(key, value);
		else
			localStorage.getItem(key);
	},

}
return LocalStore;
});