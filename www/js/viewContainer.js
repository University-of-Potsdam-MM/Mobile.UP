define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore-string',
    'utils',
    'q',
    'history'
], function($, _, Backbone, BackboneMVC, _str, utils, Q, customHistory) {

    var viewContainer = {

        initialize: function() {
            _.bindAll(this, "notifyMissingServerConnection", "removeActiveElementsOnCurrentPage");
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

        finishRendering: function (content, page) {
            content.render();

            //Meta infos aus Seite in den Header integrieren
            var $metas = content.$el.find('meta');
            if ($metas.length > 0) {
                var metas = {};
                $metas.each(function () {
                    metas[$(this).attr('name')] = $(this).attr('content');
                });
                metas.title = metas.title ? metas.title : page.title;

                var header = utils.renderheader(metas);
                $pageContainer.find('.ui-header').replaceWith(header);
            }

            var $footer = $pageContainer.find('.ui-footer');
            if ($footer.length > 0) {
                page.content.addClass('ui-page-footer-fixed');
            }

            if (content.afterRender)
                content.afterRender();
            $pageContainer.trigger("create");
        },

        saveAndPrepareScrollPosition: function () {
            scrollManager.saveScrollPositionExtract(customHistory);
            scrollManager.prepareScrollPositionExtract(Backbone.history.fragment);
        },

        executeTransition: function (transitionOptions) {
            if (transitionOptions.beforeTransition)
                transitionOptions.beforeTransition();

            Q($.mobile.changePage(transitionOptions.page.content, {
                changeHash: false,
                transition: transitionOptions.transition,
                reverse: transitionOptions.reverse
            })).done(function () {
                if (!app.currentView) {
                    $('body').css('overflow', 'auto');
                    $("body").fadeIn(100);
                }
                app.currentView = transitionOptions.page.view;
                transitionOptions.afterTransition();
            });
        },

        updateHeader: function ($el) {
            this.updateHeaderExtract($el);
        },

        updateHeaderExtract: function ($el) {
            var $metas = $el.find('meta'); //Meta infos aus Seite in den Header integrieren
            console.log($el[0]);
            var $header = $('.ui-header');
            if ($metas.length > 0) {
                var metas = {};
                $metas.each(function () {
                    metas[$(this).attr('name')] = $(this).attr('content');
                });
                if (!metas.title)
                    metas.title = $header.find('h1').html();
                var header = utils.renderheader(metas);
                $header.replaceWith(header);
            }
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
            var view = this.getView(c, a);
            if (view) { //Wenn eine View-Klasse für Content vorhanden ist: ausführen
                view = new view(params);
                view.page = page.$el;
                content = view;
            } else { //Wenn keine Viewklasse vorhanden ist, die page als view nehmen
                view = page;
                this.updateHeaderExtract(page.$el);
            }
            app.currentView = view; //app.currentView kann als Referenz im HTML z.b. im onclick-Event verwendet werden

            return content;
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

        animateHeaderAndFooter: function (a) {
            var toPage = a.toPage;
            if (typeof(a.toPage) != 'string') {
                var header = $('.header', toPage);
                var footer = $('.footer', toPage);
                var duration = 350, animating = 'footer';
                window.footerAnimating = true;
                var dir = window.reverseTransition ? 1 : -1; //Transitionsrichtung für Footeranimation ermitteln
            }
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
        prepareViewForDomDisplay: function (page) {
            // Render page, add padding for the header and append it to the pagecontainer
            page.render();
            var pageContent = page.$el.attr("data-role", "page");
            pageContent.css('padding-top', '54px');
            $pageContainer = $('#pagecontainer');
            $pageContainer.append(pageContent);
            $pageContainer.trigger("create");

            // Retrieve header title, render header and replace it
            var pageTitle = pageContent.find('meta[name="title"]').attr('content');
            var $header = $pageContainer.find('.ui-header');
            var header = utils.renderheader({title: pageTitle});
            if ($header.length > 0) {
                $header.replaceWith(header);
            } else {
                $pageContainer.append(header);
            }

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
                reverse: reverse,
                page: {
                    title: pageTitle,
                    content: pageContent,
                    view: page
                }
            };
        },

        getPage: function(c, views, params) {
            var pageName = utils.capitalize(c) + 'Page';

            // Making sure a page is found
            console.log("Looking for view", pageName, views[pageName]);
            if (!views[pageName]) {
                views[pageName] = Backbone.View.extend({
                    render: function () {
                        this.$el.html('');
                        return this;
                    }
                });
            }

            return new views[pageName](params);
        },

        getView: function (c, a) {
            return app.views[utils.capitalize(c) + utils.capitalize(a)];
        }
    };

    var scrollManager = {
        routesToScrollPositions: {},

        saveScrollPositionExtract: function (customHistory) {
            console.log(customHistory);
            if (customHistory.hasHistory()) {
                var name = customHistory.currentRoute();
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
        scrollManager: scrollManager
    };
});
