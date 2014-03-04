$(function() {
	$.widget("up.campusmenu", {
		options: {
			onChange: function(name) {},
			store: "campusmenu.default"
		},
		
		_create: function() {
			// create html code
			this.element.append(
				"<div data-role='navbar'> \
                    <ul> \
                        <li><a href='#Griebnitzsee' class='location-menu location-menu-default'>Griebnitzsee</a></li> \
                        <li><a href='#NeuesPalais' class='location-menu'>Neues Palais</a></li> \
                        <li><a href='#Golm' class='location-menu'>Golm</a></li> \
                    </ul> \
                </div>");
			this.element.children().last().navbar();
			
			// read local storage
			this.options.store = this.element.attr("data-store");
			
			// bind to click events
			var widgetParent = this;
			$(".location-menu").bind("click", function (event) {
				var source = $(this);
				
				// call onChange callback
				var target = widgetParent._retreiveSelection(source);
				widgetParent._setDefaultSelection(target);
				widgetParent.options.onChange(target);
				
				// For some unknown reason the usual tab selection code doesn't provide visual feedback, so we have to use a custom fix
				widgetParent._fixActiveTab(source, event);
			});
		},
		
		_destroy: function() {
			this.element.children().last().remove();
		},
		
		pageshow: function() {
			var selection = this._activateDefaultSelection();
			this.options.onChange(selection);
		},
		
		_setOption: function(key, value) {
			this._super(key, value);
		},
		
		_setDefaultSelection: function(selection) {
			localStorage.setItem(this.options.store, selection);
		},
		
		_getDefaultSelection: function() {
			return localStorage.getItem(this.options.store);
		},
		
		_retreiveSelection: function(selectionSource) {
			return selectionSource.attr("href").slice(1);
		},
		
		_activateDefaultSelection: function() {
			var defaultSelection = this._getDefaultSelection();
			
			if (!defaultSelection) {
				var source = $(".location-menu-default")
				defaultSelection = this._retreiveSelection(source);
				this._setDefaultSelection(defaultMensa);
			}
			
			$(".location-menu").removeClass("ui-btn-active");
			var searchExpression = "a[href='#" + defaultSelection + "']";
			$(searchExpression).addClass("ui-btn-active");
			
			return defaultSelection;
		},
		
		_fixActiveTab: function(target, event) {
			event.preventDefault();
			$(".location-menu").removeClass("ui-btn-active");
			target.addClass("ui-btn-active");
		}
	});
});
