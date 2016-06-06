// TODO: Logout Switch Missing

define([
		'jquery',
		'underscore',
		'backbone',
		'Session',
		'utils'
], function($, _, Backbone, Session, utils){
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/options");

	/**
	 * Handles the login of a user
	 * @param {Object} login Login data
	 * @param {string} login.username Username
	 * @param {string} login.password Password
	 * @param {Session} login.session Session object to be used
	 * @returns {*} jQuery promise. On successful login the promise is resolved with a Session. On failed login the promise is resolved with an error object containing error message and error code. On modified login data the promise is updated / notified with the login object.
	 */
	var executeLogin = function(login) {
		var result = $.Deferred();

		// Remove mail suffix, only username is needed
		var suffixIndex = login.username.indexOf("@");
		if (suffixIndex != -1) {
			login.username = login.username.substr(0, suffixIndex);
			result.notify(login);
		}

		// Usernames have to be all lower case, otherwise some service logins will fail
		login.username = login.username.toLowerCase();
		result.notify(login);

		var session = login.session;
		session.generateLoginURL(login);

		session.fetch({
			success: function(model, response){

				// Response contains error, so go to errorHandler
				if(response['error']){
					result.reject({message: response['error']});
				}else{
					// Everything fine, save Moodle Token and redirect to previous form
					session.setLogin({
						username: login.username,
						password: login.password,
						token: response['token'],
						authenticated: true
					});

					result.resolve(session);
				}
			},
			error: function(){
				result.reject({code: "missingConnection"});
			}
		});

		return result.promise();
	};

	app.views.OptionsLogin = Backbone.View.extend({
		model: Session,
		events: {
			'submit #loginform': 'login',
			'focus #loginform input': 'clearForm'
		},

		initialize: function(p){
			this.model = new Session();
			this.loginAttempts = 0;
			this.loginCountdown = 0;
			_.bindAll(this, 'render', 'updateCountdown');
			//this.page = p.page;
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this, 'errorHandler', this.errorHandler);
			this.listenTo(this, 'missingConnection', this.missingInternetConnectionHandler);
			this.listenToOnce(this, 'registerTimer', this.registerCountdownTimer);
		},

		errorHandler: function(){
			this.loginAttempts++;
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
			if(this.loginAttempts>=3 && !this.model.get('up.session.loginFailureTime')){
				this.model.set('up.session.loginFailureTime', new Date().getTime());
				this.loginAttempts=0;

				this.render();
				return;
			}
			console.log(this.model);
			if(this.model.get('up.session.loginFailureTime')){
				this.loginCountdown = parseInt(this.model.get('up.session.loginFailureTime'))+10*60*1000 - new Date().getTime();
				if(this.loginCountdown < 0){
					this.loginCountdown = 0;
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

			if(this.loginAttempts < 3 && this.loginCountdown == 0){
						
				var username = $('#username').val();
				var password = $('#password').val();

				var that = this;
				executeLogin({
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
			this.$el.html(this.logintemplate({countdown: this.formatCountdown(this.loginCountdown)}));
			var _this = this;
			if(this.loginCountdown > 0){
				this.$("#error3").css('display', 'block');
			}else{
				this.$("#error3").css('display', 'none');
			}
			new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});

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