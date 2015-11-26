/*
* NewsController
*/
app.controllers.news = BackboneMVC.Controller.extend({
    name: 'news',
	filter: 'recent', //Standardfilter für die News (recent), bis jetzt nur dieser
	newsSources: false,
	views:["news.index", "news.view", "news.set_sources", "news.source"], //Viewfiles des Controllers
	modules : {'news' : 'NewsPageView'},
	

    init:function(){
		this.disabledNews = LocalStore.get('disabledNews', {}); //Alle deaktivierten Newsquellen aus dem local Storage laden oder initialisieren
    },
	
	/*
	* Einzelansicht einer News
	*/
	view: function(id){
		app.loadPage(this.name, 'view', {id:id}, 'slide').done(function(){
			/*$('.news-text.unchanged').find('a').each(function(){
				$(this).attr('href', 'javascript:app.openBrowser("'+$(this).attr('href')+'")');
			})
			$('.news-text.unchanged').removeClass('unchanged');
			app.activeCon().scrollTop(0); //View nach oben scrollen*/
		});
	},
	
	default:function(){
		this.index();
	},
	/*
	* Newsliste anzeigen
	*/
    index:function(){
		var self = this;
		app.loadPage(this.name, 'index', {fetchCallback: function(collection) {
			var d = collection.response;
			console.log(d);
			self.newsSources = d.newsSources; //Newsquellen lokal speichern
		}}, 'slide');
    },
	
	/*
	* Newsquellen auswählen
	*/
	set_sources: function(){
		if(this.newsSources) { //Wenn Quellen vom Server geladen wurden, zur Seite wecheln
			app.loadPage(this.name, 'set_sources', {newsSources:this.newsSources});
		} else { //Sonst zu news/index gehen
			app.route('news/index');
		}
	},
	
	/*
	* Newsliste einer Quelle
	*/
	source: function(id){
		app.loadPage(this.name, 'source', {id:id}).done(function(){
			
		});
	},
	
	/*
	* Newsliste Pull to Refresh hinzufügen unter iOS
	*/
	addPullToRefresh:function(){
		app.viewManager.activeCon().pullToRefresh({
			refresh: function (callback) {
				app.refresh(callback);
			}
		});
	},
	
		
	/*
	* News filtern nach gewählten Quellen
	* @w: könnte in Zukunft weitere Filter sein als recent
	*/
	filterIndex: function(w){
		if(!w)
			w = this.filter;
		var lstr = '', lim = '';
		for(var i in this.disabledNews) {
			lstr += lim + 'li.news-'+i;
			lim = ',';
		}
		$('#thenewslist').children('li').css('display', 'none');
		$('#thenewslist').children('li.show-'+w).not(lstr).css('display', 'block');
		this.filter = w;
	},
	
	/*
	* Newsquellen toggeln
	* @it: getoggelte Checkbox 
	*/
	toggleNews:function(it){
		var elements = $('#newslist').find('.ch-news');
		track('newssources/toggle/'+$(it).data('id')+'/'+it.checked);
		var self = this;
		this.disabledNews = {};
		elements.each(function(i, el) {
			if(!el.checked)
				self.disabledNews[$(el).data('id')] = $(el).data('id');
		});
		LocalStore.set('disabledNews', this.disabledNews);
	},
});