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

	function TimerHelper(model, view) {
		this.loginAttempts = 0;
		this.loginCountdown = 0;

		this.incrementLoginAttempt = function() {
			this.loginAttempts++;
			this.updateCountdown();
		};

		this.start = function(callback) {
			this.timer = setInterval(function() {
				callback();
			}, 1000);
		};

		this.stop = function() {
			clearInterval(this.timer);
		};

		this.unsetFailureTimer = function() {
			//wenn login erfolgreich lösche failureTime
			model.unset('up.session.loginFailureTime');
		};

		this.isLoginAllowed = function() {
			return this.loginAttempts < 3 && this.loginCountdown == 0;
		};

		this.isCountdownActive = function() {
			return this.loginCountdown > 0;
		};

		this.updateCountdown = function() {
			if(this.loginAttempts >= 3 && !model.get('up.session.loginFailureTime')) {
				model.set('up.session.loginFailureTime', new Date().getTime());
				this.loginAttempts = 0;

				view.render();
				return;
			}
			if(model.get('up.session.loginFailureTime')){
				this.loginCountdown = parseInt(model.get('up.session.loginFailureTime'))+10*60*1000 - new Date().getTime();
				if (this.loginCountdown < 0) {
					this.loginCountdown = 0;
					model.unset('up.session.loginFailureTime');
					clearInterval(this.timer);

					this.registerCountdownTimerOnce = _.once(_.bind(this.registerCountdownTimer, this));
				} else {
					this.registerCountdownTimerOnce();
				}
			}
		};

		this.registerCountdownTimer = function() {
			this.start(_.bind(view.render, view));
		};
		this.registerCountdownTimerOnce = _.once(_.bind(this.registerCountdownTimer, this));
	}

	app.views.OptionsLogin = Backbone.View.extend({
		model: Session,
		events: {
			'submit #loginform': 'login',
			'focus #loginform input': 'clearForm'
		},

		initialize: function(p){
			this.logintemplate = rendertmpl('login');

			this.model = new Session();
			this.timerHelper = new TimerHelper(this.model, this);
			_.bindAll(this, 'render');
			//this.page = p.page;
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this, 'errorHandler', this.errorHandler);
			this.listenTo(this, 'missingConnection', this.missingInternetConnectionHandler);
		},

		errorHandler: function(){
			this.$("#error").css('display', 'block');
			this.timerHelper.incrementLoginAttempt();
		},

		clearForm: function(){
			this.$("#error").css('display', 'none');
			this.$("#error0").css('display', 'none');
		},

		stopListening: function() {
			this.timerHelper.stop();
			Backbone.View.prototype.stopListening.apply(this, arguments);
		},

		formatCountdown: function(milsec){
			var sec = Math.floor(milsec/1000);
			var formatLeadingZeroes = function(value){ return value < 10 ? "0"+value : value; };
			var min = formatLeadingZeroes(Math.floor(sec/60));
			sec = formatLeadingZeroes(sec%60);
			return min+":"+sec;
		},

		login: function(ev){
			ev.preventDefault();

			this.timerHelper.updateCountdown();
			if (this.timerHelper.isLoginAllowed()) {

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
					that.timerHelper.unsetFailureTimer();

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
			this.timerHelper.updateCountdown();
			this.setElement(this.page.find('#options'));
			this.$el.html(this.logintemplate({countdown: this.formatCountdown(this.timerHelper.loginCountdown)}));

			if (this.timerHelper.isCountdownActive()) {
				this.$("#error3").css('display', 'block');
			} else {
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