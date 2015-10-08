define([
    'jquery',
    'underscore',
    'backbone',
    'backboneMVC',
    'underscore-string',
    'utils',
    'q'
], function($, _, Backbone, BackboneMVC, _str, utils, Q) {

    var viewContainer = {

        setIosHeaderFix: function ($) {
            if ($.os.ios7) {
                $('body').addClass('ios-statusbar');
            }
        },

        setReverseSlidefadeTransition: function ($) {
            $.mobile.changePage.defaults.transition = 'slidefade';
            $.mobile.changePage.defaults.reverse = 'reverse';
        },

        finishRendering: function (content, pageTitle, pageContent, $pageContainer, utils, $) {
            content.render();

            var $metas = content.$el.find('meta'); //Meta infos aus Seite in den Header integrieren

            if ($metas.length > 0) {
                var metas = {};
                $metas.each(function () {
                    metas[$(this).attr('name')] = $(this).attr('content');
                });
                if (!metas.title)
                    metas.title = pageTitle;
                var header = utils.renderheader(metas);
                $pageContainer.find('.ui-header').replaceWith(header);
                var $footer = $pageContainer.find('.ui-footer');
                if ($footer.length > 0) {
                    pageContent.addClass('ui-page-footer-fixed');
                }
            }
            if (content.afterRender)
                content.afterRender();
            $pageContainer.trigger("create");
        },

        usePageAsView: function (page, app) {
            app.currentView = page;
            app.updateHeader(page.$el);
        },

        saveAndPrepareScrollPosition: function (app, Backbone) {
            app.saveScrollPosition();
            app.prepareScrollPositionFor(Backbone.history.fragment);
        },

        executeTransition: function (pageContent, transition, reverse, page, afterTransition, app, Q, $) {
            Q($.mobile.changePage(pageContent, {
                changeHash: false,
                transition: transition,
                reverse: reverse
            })).done(function () {
                if (!app.currentView) {
                    $('body').css('overflow', 'auto');
                    $("body").fadeIn(100);
                }
                app.currentView = page;
                afterTransition();
            });
        },

        updateHeaderExtract: function ($el, $, utils) {
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

        setCurrentView: function (params, page, content, c, a, app, utils) {
            app.currentView = {};
            params.page = page.$el;
            app.currentView = content = new app.views[utils.capitalize(c) + utils.capitalize(a)](params); //app.currentView kann als Referenz im HTML z.b. im onclick-Event verwendet werden
            content.page = page.$el;
            return content;
        },

        activePageExtract: function ($) {
            return $.mobile.activePage;
        },

        activeConExtract: function ($) {
            return $('.ui-content', this.activePage());
        },

        animateHeaderAndFooter: function (a, $) {
            var toPage = a.toPage;
            if (typeof(a.toPage) != 'string') {
                var header = $('.header', toPage);
                var footer = $('.footer', toPage);
                var duration = 350, animating = 'footer';
                window.footerAnimating = true;
                var dir = window.reverseTransition ? 1 : -1; //Transitionsrichtung f�r Footeranimation ermitteln
            }
        },

        notifyMissingServerConnection: function (app, $) {
            $('.ui-btn-active', app.activePage()).removeClass('ui-btn-active'); //Aktuell fokussierten Button deaktivieren, dass die selektierungsfarbe verschwindet
            app.previous(true);
            var s = 'Es konnte keine Verbindung zum Server hergestellt werden. Bitte �berpr�fe deine Internetverbindung';
            if (navigator.notification) //�ber Plugin f�r App
                navigator.notification.alert(s, null, 'Kein Internet'); //Fehlermeldung ausgeben
            else
                alert(s); //F�r Browser
        },

        prepareViewForDomDisplay: function (page, c, a, $, utils) {
            // prepare new view for DOM display
            page.render();
            console.log(utils.capitalize(c) + utils.capitalize(a));

            var d = {};
            var response = {};

            var pageContent = page.$el.attr("data-role", "page");
            var pageTitle = pageContent.find('meta[name="title"]').attr('content');

            var header = utils.renderheader({title: pageTitle});

            pageContent.css('padding-top', '54px');
            $pageContainer = $('#pagecontainer');
            var $header = $pageContainer.find('.ui-header');
            $pageContainer.append(pageContent);
            $pageContainer.trigger("create");
            if ($header.length > 0) {
                $header.replaceWith(header);
            } else {
                $pageContainer.append(header);
            }
            var transition = $.mobile.changePage.defaults.transition;
            var reverse = $.mobile.changePage.defaults.reverse;

            var transition = $.mobile.defaultPageTransition;
            // Erste Seite nicht sliden
            if (this.firstPage) {
                transition = 'none';
                this.firstPage = false;
            }
            return {
                d: d,
                response: response,
                pageContent: pageContent,
                pageTitle: pageTitle,
                reverse: reverse,
                transition: transition
            };
        }
    };

    var scrollManager = {
        routesToScrollPositions: {},

        saveScrollPositionExtract: function (customHistory, $) {
            console.log(customHistory);
            if (customHistory.hasHistory()) {
                var name = customHistory.currentRoute();
                this.routesToScrollPositions[name] = $(window).scrollTop();
            }
        },

        prepareScrollPositionExtract: function (route, $) {
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