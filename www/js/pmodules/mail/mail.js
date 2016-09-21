define([
	'jquery',
	'underscore',
	'backbone',
	'utils',
	'Session',
	'pmodules/mail/mail.login'
], function($, _, Backbone, utils, Session, maillogin) {
	var rendertmpl = _.partial(utils.rendertmpl, _, "js/pmodules/mail");
	
	app.views.MailPage = Backbone.View.extend({

		render: function(){
			this.$el.html('');
			return this;
		}
	});
	
	app.views.MailIndex = Backbone.View.extend({
		attributes: {"id": 'mail'},

		initialize: function(p){
			this.page = p.page;
			this.template = rendertmpl('mail');

			this.listenToOnce(this, "afterRender", this.startMailLogin);
		},

		startMailLogin: function() {
			maillogin.loginMail(new Session()).done(function() {
				// Navigate back to main menu
				app.route("main/menu", false, true);
			}).fail(_.bind(function(status) {
				// Show error message
				this.$el.find(".mail-message").hide();
				if (status.code === 1) {
					this.$el.find(".mail-error").show();
				} else {
					this.$el.find(".mail-credentials").show();
				}
			}, this));
		},

		render: function(){
			this.$el = this.page;
			this.$el.attr('id', 'mail');
			this.$el.html(this.template({}));
			this.$el.trigger("create");

			this.trigger("afterRender");
			return this;
		}
	});

	return app.views;
});