odoo.define('bean_theme.suggested_product_slider', function (require) {
'use strict';

const publicWidget = require('web.public.widget');
const ProductRootWidget = require('bean_theme.product.root.widget');
const { _t } = require('web.core');
const { ProductsBlockMixins } = require('bean_theme.mixins');

publicWidget.registry.TpSuggestedProductSlider = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.tp-suggested-product-slider',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    xmlDependencies: ProductRootWidget.prototype.xmlDependencies.concat(
        ['/bean_theme/static/src/xml/frontend/suggested_product_slider.xml']
    ),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),
    bodyTemplate: 's_d_products_grid_tmpl',
    bodySelector: '.tp-suggested-products-cards',
    controllerRoute: '/bean_theme/get_products_data',
    fieldstoFetch: ['dr_label_id', 'public_categ_ids'],

    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this._initializeOWL();
    },
    _initializeOWL: function () {
        const $owlSlider = this.$('.owl-carousel');
        const responsiveParams = { 0: { items: 2 }, 576: { items: 2 }, 768: { items: 2 }, 992: { items: 2 }, 1200: { items: 3 } };
        if (!this.$target.data('two-block')) {
            _.extend(responsiveParams, { 768: { items: 3 }, 992: { items: 4 }, 1200: { items: 6 } });
        }
        $owlSlider.removeClass('d-none container');
        $owlSlider.owlCarousel({
            dots: false,
            margin: 15,
            stagePadding: 6,
            autoplay: true,
            autoplayTimeout: 3000,
            autoplayHoverPause: true,
            rewind: true,
            rtl: _t.database.parameters.direction === 'rtl',
            responsive: responsiveParams,
        });
        this.$('.tp-prev').click(function () {
            $owlSlider.trigger('prev.owl.carousel');
        });
        this.$('.tp-next').click(function () {
            $owlSlider.trigger('next.owl.carousel');
        });
    },
});

});
