// TODO: Logout Switch Missing

define([
		'jquery',
		'underscore',
		'backbone',
		'Session',
		'pmodules/options/options.login',
		'utils'
], function($, _, Backbone, Session, login, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/options");

	function TimerHelper() {
		this.loginAttempts = 0;
		this.loginCountdown = 0;
	}

	app.views.OptionsLogin = Backbone.View.extend({
		model: Session,
		events: {
			'submit #loginform': 'login',
			'focus #loginform input': 'clearForm'
		},

		initialize: function(p){
			this.model = new Session();
			this.timerHelper = new TimerHelper;
			_.bindAll(this, 'render', 'updateCountdown');
			//this.page = p.page;
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this, 'errorHandler', this.errorHandler);
			this.listenTo(this, 'missingConnection', this.missingInternetConnectionHandler);
			this.listenToOnce(this, 'registerTimer', this.registerCountdownTimer);
		},

		errorHandler: function(){
			this.timerHelper.loginAttempts++;
			this.$("#error").css('display', 'block');
			this.updateCountdown();
		},

		clearForm: function(){
			this.$("#error").css('display', 'none');
			this.$("#error0").css('display', 'none');
			
		},

		stopListening: function() {
			clearInterval(this.timer);
			Backbone.View.prototype.stopListening.apply(this, arguments);
		},

		registerCountdownTimer: function() {
			this.timer=setInterval(function() {
				this.render();
			}.bind(this), 1000);
		},

		formatCountdown: function(milsec){
			var sec = Math.floor(milsec/1000);
			var formatLeadingZeroes = function(value){ return value < 10 ? "0"+value : value; };
			var min = formatLeadingZeroes(Math.floor(sec/60));
			sec = formatLeadingZeroes(sec%60);
			return min+":"+sec;
		},

		updateCountdown: function() {
			if(this.timerHelper.loginAttempts>=3 && !this.model.get('up.session.loginFailureTime')){
				this.model.set('up.session.loginFailureTime', new Date().getTime());
				this.timerHelper.loginAttempts=0;

				this.render();
				return;
			}
			console.log(this.model);
			if(this.model.get('up.session.loginFailureTime')){
				this.timerHelper.loginCountdown = parseInt(this.model.get('up.session.loginFailureTime'))+10*60*1000 - new Date().getTime();
				if(this.timerHelper.loginCountdown < 0){
					this.timerHelper.loginCountdown = 0;
					this.model.unset('up.session.loginFailureTime');
					clearInterval(this.timer);
					this.listenToOnce(this, 'registerTimer', this.registerCountdownTimer);
				}else{
					this.trigger('registerTimer');
				}
			}
		},

		login: function(ev){
			ev.preventDefault();
			console.log(this);
			this.updateCountdown();

			if(this.timerHelper.loginAttempts < 3 && this.timerHelper.loginCountdown == 0){
						
				var username = $('#username').val();
				var password = $('#password').val();

				if (this.loadingView) {
					this.loadingView.spinnerOn();
				}

				var that = this;
				login.executeLogin({
					username: username,
					password: password,
					session: that.model
				}).progress(function(login) {
					$('#username').val(login.username);
				}).done(function(session) {
					//wenn login erfolgreich lösche failureTime
					that.model.unset('up.session.loginFailureTime');

					if(that.model.get('up.session.redirectFrom')){
						var path = that.model.get('up.session.redirectFrom');
						that.model.unset('up.session.redirectFrom');
						app.route(path);
					}else{
						app.route('');
					}
				}).fail(function(error) {
					if (error.code === "missingConnection") {
						// render error view
						that.trigger("missingConnection");
					} else {
						console.log(error.message);
						that.trigger("errorHandler");
					}
				}).always(function() {
					if (that.loadingView) {
						that.loadingView.spinnerOff();
					}
				});
			}else{
				this.render();
			}
		},
		
		render: function(){
			this.updateCountdown();
			this.logintemplate = rendertmpl('login');
			console.log(this.page)
			this.setElement(this.page.find('#options'));
			this.$el.html(this.logintemplate({countdown: this.formatCountdown(this.timerHelper.loginCountdown)}));
			var _this = this;
			if(this.timerHelper.loginCountdown > 0){
				this.$("#error3").css('display', 'block');
			}else{
				this.$("#error3").css('display', 'none');
			}
			this.loadingView = new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});

			return this;
		}
	});
	
	app.views.OptionsLogout = Backbone.View.extend({
		model: Session,
		events:{
			'submit #logoutform': 'logout'
		},

		initialize: function(){
			this.model = new Session();
		},
		
		logout: function(ev){
			ev.preventDefault();
			this.model.unsetLogin();
			this.model.clearPrivateCache();
			app.route('');
		},
		
		render: function(){
			this.logouttemplate = rendertmpl('logout');
			this.setElement(this.page.find('#options'));
			this.$el.html(this.logouttemplate({}));

			new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});
			return this;
		},

		missingInternetConnectionHandler: function(){
			this.$("#error0").css('display', 'block');
		}
	});

	/**
	 *	BackboneView - OptionsPageView
	 *	Login & Logout-Form which validates the username and password using the Moodle Webservice
	 *	TODO: will be substituted by use of local Accounts and by the use of the Mobile Proxy of the DFN
	 */
	app.views.OptionsPage = Backbone.View.extend({
		model: Session,
		attributes: {"id": 'options'},

		initialize: function(){
			this.template = rendertmpl('options');
		},

		render: function(){
			var $el = $(this.el); 
			$el.html(this.template({}));
			$el.trigger("create");
			return this;
		}
	});

	return app.views.OptionsPage;
});