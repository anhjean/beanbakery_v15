odoo.define('bean_theme.ajaxload', function (require) {
'use strict';

let {qweb} = require('web.core');
let publicWidget = require('web.public.widget');

publicWidget.registry.DrAjaxLoadProducts = publicWidget.Widget.extend({
    xmlDependencies: ['/bean_theme/static/src/xml/core/snippet_root_widget.xml'],
    selector: '#products_grid',
    read_events: {
        'click .tp-load-more-products': '_onClickLoadMoreProductsBtn'
    },
    /**
     * @override
     */
    start: function () {
        var self = this;
        var defs = [this._super.apply(this, arguments)];
        this.ajaxEnabled = odoo.dr_theme_config.json_lazy_load_config.enable_ajax_load_products;
        this.ajaxLoadOnClick = odoo.dr_theme_config.json_lazy_load_config.enable_ajax_load_products_on_click;
        this.$pager = $('.products_pager');
        this.$tpRTargetElement = $('#wrapwrap'); // #wrapwrap for now bcoz window is not scrolleble in v14
        if (this.ajaxEnabled && this.$pager.children().length && this.$('.o_wsale_products_grid_table_wrapper tbody tr:last').length) {
            this.$pager.addClass('d-none');
            this._setState();
            if (!this.ajaxLoadOnClick) {
                var position = this.$tpRTargetElement.scrollTop();
                this.$tpRTargetElement.on('scroll.ajax_load_product', _.throttle(function (ev) {
                    var scroll = self.$tpRTargetElement.scrollTop();
                    if (scroll > position) {
                        // Trigger only when scrollDown
                        self._onScrollEvent(ev);
                    }
                    position = scroll;
                }, 20));
            } else {
                $(qweb.render('tp_load_more_products_template')).appendTo(self.$('.o_wsale_products_grid_table_wrapper'));
            }
        }
        return Promise.all(defs);
    },
    _setState: function () {
        this.$lastLoadedProduct = this.$('.o_wsale_products_grid_table_wrapper tbody tr:last');
        this.$productsContainer = this.$('.o_wsale_products_grid_table_wrapper tbody');
        this.readyNextForAjax = true;
        this.pageURL = this.$pager.find('li:last a').attr('href');
        this.lastLoadedPage = 1;
        this.totalPages = parseInt(this.$target.get(0).dataset.totalPages);
    },
    _loadAndAppendProducts: function () {
        var self = this;
        this.readyNextForAjax = false;
        var newPage = self.lastLoadedPage + 1;
        $.ajax({
            url: this.pageURL,
            type: 'GET',
            beforeSend: function () {
                if (self.ajaxLoadOnClick) {
                    self.$('.tp-load-more-products').addClass('disabled');
                } else {
                    $(qweb.render('BeanBakery_default_loader')).appendTo(self.$('.o_wsale_products_grid_table_wrapper'));
                }
            },
            success: function (page) {
                self.$('.d_spinner_loader').remove();
                self.$('.tp-load-more-products').removeClass('disabled');
                let $renderedPage = $(page);
                let $productsToAdd = $renderedPage.find("#products_grid .o_wsale_products_grid_table_wrapper table tr");
                self.$productsContainer.append($productsToAdd);
                self.readyNextForAjax = true;
                self.$lastLoadedProduct = self.$('.o_wsale_products_grid_table_wrapper tbody tr:last');
                self.lastLoadedPage = newPage;
                self.pageURL = $renderedPage.find('.products_pager li:last a').attr('href');
                if ($renderedPage.find('.products_pager li:last').hasClass('disabled')) {
                    $(qweb.render('dr_all_products_loaded')).appendTo(self.$('.o_wsale_products_grid_table_wrapper'));
                    self.$('.tp-load-more-products-container').remove();
                }
                self.trigger_up('widgets_start_request', {
                    $target: $('.tp-product-quick-view-action'),
                });
                self.trigger_up('widgets_start_request', {
                    $target: $('.tp_show_similar_products'),
                });
            }
        });
    },
    _onClickLoadMoreProductsBtn: function (ev) {
        this._loadAndAppendProducts();
    },
    _onScrollEvent: function (ev) {
        if (this.$lastLoadedProduct.length && this.$lastLoadedProduct.offset().top - this.$tpRTargetElement.scrollTop() + this.$lastLoadedProduct.height() < this.$tpRTargetElement.height() - 25 && this.readyNextForAjax && this.totalPages > this.lastLoadedPage) {
            this._loadAndAppendProducts();
        }
    },
});



});
