define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore-string',
    'utils',
    'q',
    'history',
    'contentLoader'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory, contentLoader) {

    var pageContainer = _.extend({

        initialize: function() {
            this.listenTo(this, "beforeTransition", this.prepareViewForTransition);
        },

        getPageContainer: function () {
            if (!this.$pageContainer) {
                this.$pageContainer = $('#pagecontainer');
            }
            return this.$pageContainer;
        },

        addToContainer: function(pageContent) {
            this.getPageContainer().append(pageContent);
            this.getPageContainer().trigger("create");
        },

        switchHeaders: function(header) {
            var $header = this.getPageContainer().find('.ui-header');
            if ($header.length > 0) {
                $header.replaceWith(header);
            } else {
                this.getPageContainer().append(header);
            }
        },

        saveAndPrepareScrollPosition: function (transitionOptions) {
            scrollManager.saveScrollPositionExtract(transitionOptions);
            scrollManager.prepareScrollPositionExtract(transitionOptions.route.to);
        },

        prepareViewForTransition: function(transitionOptions) {
            var page = transitionOptions.page.view;

            // Render page, add padding for the header and update it
            page.render();
            var pageContent = page.$el.attr("data-role", "page").css('padding-top', '54px');
            this.updateHeader(pageContent);

            transitionOptions.page.content = pageContent;
        },

        executeTransition: function (transitionOptions) {
            this.trigger("beforeTransition", transitionOptions);

            this.addToContainer(transitionOptions.page.content);
            Q($.mobile.changePage(transitionOptions.page.content, {
                changeHash: false,
                transition: transitionOptions.transition,
                reverse: transitionOptions.reverse
            })).done(_.bind(function () {
                if (!app.currentView) {
                    $('body').css('overflow', 'auto');
                    $("body").fadeIn(100);
                }
                app.currentView = transitionOptions.page.view;

                this.trigger("afterTransition", transitionOptions);
            }, this));
        },

        updateHeader: function($el, page) {
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
                this.switchHeaders(header);
            }
        },

        ensureFooterFixed: function(page) {
            var $footer = this.getPageContainer().find('.ui-footer');
            if ($footer.length > 0) {
                page.content.addClass('ui-page-footer-fixed');
            }
        }
    }, Backbone.Events);

    pageContainer.initialize();

    var viewContainer = _.extend({

        initialize: function() {
            _.bindAll(this, "notifyMissingServerConnection", "removeActiveElementsOnCurrentPage");

            this.listenTo(pageContainer, "beforeTransition", pageContainer.saveAndPrepareScrollPosition);
            this.listenTo(pageContainer, "beforeTransition", function(options) { customHistory.push(options.route.to); });
            this.listenTo(pageContainer, "afterTransition", this.afterTransition);
        },

        setIosHeaderFix: function () {
            if ($.os.ios7) {
                $('body').addClass('ios-statusbar');
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

            var headerUpdate = {};
            if (content) {
                headerUpdate.$el = content.$el;
                headerUpdate.page = page;
            } else {
                headerUpdate.$el = view.$el;
            }
            pageContainer.updateHeader(headerUpdate.$el, headerUpdate.page);

            if (content) {
                pageContainer.ensureFooterFixed(page);
            }

            if (content.afterRender)
                content.afterRender();
            pageContainer.getPageContainer().trigger("create");
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

            contentLoader.initData(c);
            var contentAndView = viewContainer.createViewForName(c, a, page, params);

            var content = contentAndView.content;
            var view = contentAndView.view;

            contentLoader.retreiveOrFetchContent(content, {}, params, c, a, function(d) {
                console.log("Finish rendering");
                viewContainer.finishRendering(content, transitionOptions.page, view);
                q.resolve(d, content);
            });
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
            var view;
            if (this.hasView(c, a)) { //Wenn eine View-Klasse für Content vorhanden ist: ausführen
                view = this.instanciateView(c, a, params);
                view.page = page.$el;
                content = view;
            } else { //Wenn keine Viewklasse vorhanden ist, die page als view nehmen
                view = page;
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

        activeCon: function() {
            return this.activeConExtract();
        },

        /*
         * InhaltsContainer der momentan aktiven Seite zurückgeben
         */
        activeConExtract: function () {
            return $('.ui-content', this.activePageExtract());
        },

        notifyMissingServerConnection: function (app) {
            $('.ui-btn-active', this.activePageExtract()).removeClass('ui-btn-active'); //Aktuell fokussierten Button deaktivieren, dass die selektierungsfarbe verschwindet
            app.previous(true);
            var s = 'Es konnte keine Verbindung zum Server hergestellt werden. Bitte überprüfe deine Internetverbindung';
            if (navigator.notification) //Über Plugin für App
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
            var page = this.instanciatePage(c, params);

            var transitionChoice = this._chooseTransition();

            return {
                transition: transitionChoice.transition,
                reverse: transitionChoice.reverse,
                page: {
                    view: page
                }
            };
        },

        _chooseTransition: function() {
            // Retrieve transitions
            var transition = $.mobile.defaultPageTransition;
            var reverse = $.mobile.changePage.defaults.reverse;

            // Erste Seite nicht sliden
            if (this.firstPage) {
                transition = 'none';
                this.firstPage = false;
            }

            return {
                transition: transition,
                reverse: reverse
            };
        },

        instanciatePage: function(c, params) {
           return this.instanciateView(c, 'Page', params);
        },

        instanciateView: function(c, a, params) {
            var View = this.getView(c, a);
            return new View(params);
        },

        hasView: function(c, a) {
            return app.views[utils.capitalize(c) + utils.capitalize(a)];
        },

        getView: function (c, a) {
            var pageName = utils.capitalize(c) + utils.capitalize(a);
            if (!app.views[pageName]) {
                app.views[pageName] = utils.EmptyPage;
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
