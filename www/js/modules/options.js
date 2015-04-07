// TODO: Logout Switch Missing

define([
		'jquery',
		'underscore',
		'backbone',
		'Session',
		'utils'
], function($, _, Backbone, Session, utils){

	/**
	 *	BackboneView - OptionsPageView
	 *	Login & Logout-Form which validates the username and password using the Moodle Webservice
	 *	TODO: will be substituted by use of local Accounts and by the use of the Mobile Proxy of the DFN
	 */
	var OptionsPageView = Backbone.View.extend({
		model: Session,
		attributes: {"id": 'options'},

		events: {
			'submit #loginform': 'login',
			'submit #logoutform': 'logout',
			'focus #loginform input': 'clearForm'
		},

		initialize: function(){
			this.loginAttempts = 0;
			this.loginCountdown = 0;
			this.logintemplate = utils.rendertmpl('login');
			this.logouttemplate = utils.rendertmpl('logout');

			this.listenTo(this.model,'change', this.render);
			this.listenTo(this, "errorHandler", this.errorHandler);
			this.listenToOnce(this, 'registerTimer', this.registerCountdownTimer);
		},

		stopListening: function() {
			clearInterval(this.timer);
			Backbone.View.prototype.stopListening.apply(this, arguments);
		},

		render: function(){
			this.updateCountdown();
			if (this.model.get('up.session.authenticated')){
				this.$el.html(this.logouttemplate({countdown: this.formatCountdown(this.loginCountdown)}));
			}else{
				this.$el.html(this.logintemplate({countdown: this.formatCountdown(this.loginCountdown)}));
			}

			if(this.loginCountdown > 0){
				this.$("#error3").css('display', 'block');
			}else{
				this.$("#error3").css('display', 'none');
			}
			this.$el.trigger("create");
			return this;
		},

		login: function(ev){
			ev.preventDefault();
			this.updateCountdown();

			if(this.loginAttempts < 3 && this.loginCountdown == 0){
						
				var username = $('#username').val();
				var password = $('#password').val();
				
				// Remove mail suffix, only username is needed
				suffixIndex = username.indexOf("@");
				if (suffixIndex != -1) {
					username = username.substr(0, suffixIndex);
					$('#username').val(username);
				}
				
				// Usernames have to be all lower case, otherwise some service logins will fail
				username = username.toLowerCase()
				$('#username').val(username);
				
				this.model.generateLoginURL({username: username, password: password});
				if (!this.LoadingView) {this.LoadingView = new utils.LoadingView({model: this.model, el: this.$("#loadingSpinner")});}
				var that = this;
				this.model.fetch({
					success: function(model, response, options){

						// Response contains error, so go to errorHandler
						if(response['error']){
							console.log(response['error']);
							that.trigger("errorHandler");
						}else{
							// Everything fine, save Moodle Token and redirect to previous form
							that.model.set('up.session.authenticated', true);
							that.model.set('up.session.username', username);
            				that.model.set('up.session.password', password);
							that.model.set('up.session.MoodleToken', response['token']);
							this.model.unset('up.session.loginFailureTime');	//wenn login erfolgreich lösche failureTime

							var path = '';
							if(that.model.get('up.session.redirectFrom')){
		                		path = that.model.get('up.session.redirectFrom');
		                		that.model.unset('up.session.redirectFrom');
		            		}
							Backbone.history.navigate(path, { trigger : true, replace: true });
						}

					},
					error: function(model, response, options){
						console.log(response);
						// render error view
						that.trigger("errorHandler");
					}
				});
			}else{
				if(this.loginAttempts==3){
					this.model.set('up.session.loginFailureTime', new Date().getTime());
					this.loginAttempts=0;
				}
				this.render();
			}
		},

		logout: function(ev){
			ev.preventDefault();
			this.model.unset('up.session.authenticated');
            this.model.unset('up.session.username');
            this.model.unset('up.session.password');
            this.model.unset('up.session.MoodleToken');
            this.model.clearPrivateCache();
			Backbone.history.navigate('', { trigger : true, replace: true });
		},

		errorHandler: function(){
			this.loginAttempts++;
			this.$("#error").css('display', 'block');
		},

		clearForm: function(){
			this.$("#error").css('display', 'none');
		},

		updateCountdown: function() {
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
		}

	});

	return OptionsPageView;
});