define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    var ListView = Backbone.View.extend({
        views: [],

        initialize: function(options) {
            this.view = options.view;
            this.postRender = options.postRender || function() {};

            this.createViews();
            this.listenTo(this.collection, "add", this.onAdd);
            this.listenTo(this.collection, "remove", this.onRemove);
            this.listenTo(this.collection, "reset", this.onReset);
            this.listenTo(this.collection, "sort", this.onSort);
            this.listenTo(this.collection, "update", this.onUpdate);
        },

        createView: function(model) {
            var view = new this.view({model: model});
            this.views.push(view);
            return view;
        },

        createViews: function() {
            this.views = [];
            this.collection.each(_.bind(function(model) {
                this.createView(model);
            }, this));
            return this.views;
        },

        onAdd: function(model) {
            var view = this.createView(model);
            this.$el.append(view.render().$el);
            this.postRender();
        },

        onRemove: function(model) {
            for (var i in this.views) {
                if (this.views[i].model === model) {
                    this.views[i].$el.remove();
                    delete this.views[i];
                }
            }
            this.postRender();
        },

        onReset: function () {
            this.createViews();
            this.render();
        },

        onSort: function() {
            this.onReset();
        },

        onUpdate: function() {
            console.warn("onUpdate not implemented", arguments);
        },

        render: function() {
            this.$el.empty();
            for (var i in this.views) {
                this.$el.append(this.views[i].render().$el);
            }
            this.postRender();
            return this;
        }
    });

    var ElementView = Backbone.View.extend({

        initialize: function (options) {
            //this.template = options.template; //rendertmpl('mensa_meal');
            this.postRender = this.postRender || function() {};
            this.listenTo(this.model, "change", function(model) {
                console.warn("model changed", model);
            });
        },

        render: function() {
            this.setElement(this.template({model: this.model.attributes}));
            this.postRender();
            //this.$el.trigger("create");
            return this;
        }
    });

    return {
        ListView: ListView,
        ElementView: ElementView
    };
});
