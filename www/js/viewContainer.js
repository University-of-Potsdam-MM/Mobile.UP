define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore.string',
    'utils',
    'history'
], function ($, _, Backbone, BackboneMVC, _str, utils, customHistory) {
    var pageContainer = _.extend({

        initialize: function() {
            this.listenTo(this, "beforeTransition", this._prepareViewForTransition);
            this.listenTo(this, "beforeTransition", this._chooseTransition);
            this.listenTo(this, "beforeTransition", this._saveAndPrepareScrollPosition);
            this.listenTo(this, "beforeTransition", this._addToContainer);
            this.listenTo(this, "afterTransition", this._updateCurrentView);
        },

        _getPageContainer: function () {
            if (!this.$pageContainer) {
                this.$pageContainer = $('#pagecontainer');
                $.mobile.hideUrlBar = false;
            }
            return this.$pageContainer;
        },

        _addToContainer: function(transitionOptions) {
            this._getPageContainer().append(transitionOptions.page.$el);
            this._getPageContainer().trigger("create");
        },

        _switchHeaders: function(header) {
            var $header = this._getPageContainer().find('.ui-header');
            if ($header.length > 0) {
                $header.replaceWith(header);
            } else {
                this._getPageContainer().append(header);
            }
        },

        _saveAndPrepareScrollPosition: function (transitionOptions) {
            scrollManager.saveScrollPositionExtract(transitionOptions);
            scrollManager.prepareScrollPositionExtract(transitionOptions.route.to);
        },

        _prepareViewForTransition: function(transitionOptions) {
            var page = transitionOptions.page;

            // Render page, add padding for the header and update the header
            page.render();
            var pageContent = page.$el.attr("data-role", "page").css('padding-top', window.device.ios7 ? '79px' : '54px');
            this.updateHeader(pageContent);
        },

        _chooseTransition: function(transitionOptions) {
            // Retrieve transitions
            var transition = $.mobile.defaultPageTransition;
            var reverse = $.mobile.changePage.defaults.reverse;

            // Erste Seite nicht sliden
            if (this.firstPage) {
                transition = 'none';
                this.firstPage = false;
            }

            transitionOptions.transition = transition;
            transitionOptions.reverse = reverse;
        },

        executeTransition: function (transitionOptions) {
            this.trigger("beforeTransition", transitionOptions);

            $.mobile.changePage(transitionOptions.page.$el, {
                changeHash: false,
                transition: transitionOptions.transition,
                reverse: transitionOptions.reverse
            });

            this.trigger("afterTransition", transitionOptions);
        },

        _updateCurrentView: function(transitionOptions) {
            if (!app.currentView) {
                $('body').css('overflow', 'auto');
                $("body").fadeIn(100);
            }
            app.currentView = transitionOptions.page;
        },

        updateHeader: function($el) {
            //Meta infos aus Seite in den Header integrieren
            var $metas = $el.find('meta');
            if ($metas.length > 0) {
                var metas = {};
                $metas.each(function () {
                    metas[$(this).attr('name')] = $(this).attr('content');
                });

                if (!metas.title) {
                    metas.title = $('.ui-header').find('h1').html();
                }

                var header = utils.renderheader(metas);
                this._switchHeaders(header);
            }
        },

        ensureFooterFixed: function(page) {
            var $footer = this._getPageContainer().find('.ui-footer');
            if ($footer.length > 0) {
                page.$el.addClass('ui-page-footer-fixed');
            }
        }
    }, Backbone.Events);

    pageContainer.initialize();

    var viewContainer = _.extend({

        initialize: function() {
            _.bindAll(this, "notifyMissingServerConnection", "removeActiveElementsOnCurrentPage");

            this.listenTo(pageContainer, "afterTransition", this.afterTransition);
        },

        setIosHeaderFix: function () {
            if (window.device.ios7) {
                $('body').addClass('ios-statusbar');
                $("div[data-role='page']").css('padding-top', '79px');
            }
        },

        setReverseSlidefadeTransition: function () {
            $.mobile.changePage.defaults.transition = 'slidefade';
            $.mobile.changePage.defaults.reverse = 'reverse';
        },

        finishRendering: function (content, page, view) {
            if (content) {
                content.render();
            }

            pageContainer.updateHeader(content ? content.$el : view.$el);

            if (content) {
                pageContainer.ensureFooterFixed(page);
            }

            if (content.afterRender)
                content.afterRender();
            pageContainer._getPageContainer().trigger("create");
        },

        /**
         * Wird nach Pagetransition ausgeführt
         */
        afterTransition: function(transitionOptions) {
            var c = transitionOptions.extras.c;
            var a = transitionOptions.extras.a;
            var page = transitionOptions.extras.page;
            var params = transitionOptions.extras.params;
            var q = transitionOptions.extras.q;

            var contentAndView = viewContainer.createViewForName(c, a, page, params);

            var content = contentAndView.content;
            var view = contentAndView.view;

            viewContainer.finishRendering(content, transitionOptions.page, view);
            q.resolve(undefined, content);
        },

        updateHeader: function ($el) {
            pageContainer.updateHeader($el);
        },

        /**
         * @param c Controllername
         * @param a Actionsname
         * @param page
         * @param params
         * @returns Instance of Backbone.View or false
         */
        createViewForName: function (c, a, page, params) {
            params.page = page.$el;

            var content = false;
            var view = page; //Wenn keine Viewklasse vorhanden ist, die page als view nehmen
            if (this.hasView(c, a)) { //Wenn eine View-Klasse für Content vorhanden ist: ausführen
                content = view = this.instanciateView(c, a, params);
            }
            app.currentView = view; //app.currentView kann als Referenz im HTML z.b. im onclick-Event verwendet werden

            return {
                content: content,
                view: view
            };
        },

        /*
         * Momentan aktive Seite zurückgeben
         */
        activePageExtract: function () {
            return $.mobile.activePage;
        },

        /*
         * InhaltsContainer der momentan aktiven Seite zurückgeben
         */
        activeCon: function() {
            return $('.ui-content', this.activePageExtract());
        },

        notifyMissingServerConnection: function (app) {
            $('.ui-btn-active', this.activePageExtract()).removeClass('ui-btn-active'); //Aktuell fokussierten Button deaktivieren, dass die selektierungsfarbe verschwindet
            app.previous(true);
            var s = 'Es konnte keine Verbindung zum Server hergestellt werden. Bitte überprüfe deine Internetverbindung';
            if (navigator.notification) //über Plugin für App
                navigator.notification.alert(s, null, 'Kein Internet'); //Fehlermeldung ausgeben
            else
                alert(s); //Für Browser
        },

        removeActiveElementsOnCurrentPage: function() {
            $('.ui-btn-active', this.activePageExtract()).removeClass('ui-btn-active');
        },

        /**
         * prepare new view for DOM display
         */
        prepareViewForDomDisplay: function (c, params) {
            return this.instanciateView(c, 'Page', params);
        },

        instanciateView: function(c, a, params) {
            var View = this.getView(c, a);
            var result = new View(params);
            if (params.page) {
                result.page = params.page;
            }
            return result;
        },

        hasView: function(c, a) {
            return app.views[utils.capitalize(c) + utils.capitalize(a)];
        },

        getView: function (c, a) {
            var pageName = utils.capitalize(c) + utils.capitalize(a);
            if (!app.views[pageName]) {
                app.views[pageName] = utils.EmptyPage;
                console.warn("Did not find", pageName, "used EmptyPage instead");
            }
            return app.views[pageName];
        }
    }, Backbone.Events);

    var scrollManager = {
        routesToScrollPositions: {},

        saveScrollPositionExtract: function (transitionOptions) {
            var name = transitionOptions.route.from;
            if (name) {
                this.routesToScrollPositions[name] = $(window).scrollTop();
            }
        },

        prepareScrollPositionExtract: function (route) {
            var pos = 0;
            //alert(route);
            if (this.routesToScrollPositions[route]) {
                pos = this.routesToScrollPositions[route];
                delete this.routesToScrollPositions[route]
            }

            // We only have one active page because jQuery mobiles custom history is disabled
            var activePage = $.mobile.navigate.history.getActive();
            activePage.lastScroll = pos;
        }
    };

    return {
        viewContainer: viewContainer,
        scrollManager: scrollManager,
        pageContainer: pageContainer
    };
});
