odoo.define('bean_theme.mixins', function (require) {
"use strict";

let wUtils = require('website.utils');
let { Markup} = require('web.utils');
let {qweb, _t} = require('web.core');
let ConfirmationDialog = require('bean_theme.cart_confirmation_dialog');
let {updateCartNavBar} = require('website_sale.utils');

const { CartSidebar } = require('bean_theme.sidebar');


let BeanBakeryUtils = {
    _getDomainWithWebsite: function (domain) {
        return domain.concat(wUtils.websiteDomain(this));
    },
    _getShopConfig: async function () {
        return await this._rpc({ model: 'website', method: 'get_bean_theme_shop_config' });
    },
};

let MarkupRecords = {
    _markUpValues: function (fieldNames, records) {
        records.forEach(record => {
            for (const fieldName of fieldNames) {
                if (record[fieldName]) {
                    record[fieldName] = Markup(record[fieldName]);
                }
            }
        });
        return records;
    }
};

let SortableMixins = {
    /**
     * @private
     */
    _makeListSortable: function () {
        this.$('.d_sortable_block').nestedSortable({
            listType: 'ul',
            protectRoot: true,
            handle: '.d_sortable_item_handel',
            items: 'li',
            toleranceElement: '> .row',
            forcePlaceholderSize: true,
            opacity: 0.6,
            tolerance: 'pointer',
            placeholder: 'd_drag_placeholder',
            maxLevels: 0,
            expression: '()(.+)',
        });
    },
};

let cartMixin = {
    /**
    * @private
    */
    _addProductToCart: function (cartInfo, QuickViewDialog) {
        // Do not add variant for default flow
        let dialogOptions = {mini: true, size: 'small'};
        dialogOptions['variantID'] = cartInfo.productID;
        this.QuickViewDialog = new QuickViewDialog(this, dialogOptions).open();
        var params = {product_id: cartInfo.productID, add_qty: 1};
        if (this._customCartSubmit) {
            this.QuickViewDialog.on('tp_auto_add_product', null, this._customCartSubmit.bind(this, params));
        }
        return this.QuickViewDialog;
    },

    /**
    * @private
    */
    _getCartParams: function (ev) {
        return {productID: parseInt($(ev.currentTarget).attr('data-product-product-id')), qty: 1};
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param  {Event} ev
     */
    onAddToCartClick: function (ev, QuickViewDialog) {
        this._addProductToCart(this._getCartParams(ev), QuickViewDialog);
    },
};

let ProductCarouselMixins = {
    _bindEvents: function ($target) {
        // Resolve conflict when multiple product carousel on same page
        const $carousel = $target.find('#o-carousel-product');
        $carousel.addClass('d_shop_product_details_carousel');
        $carousel.find('.carousel-indicators li').on('click', ev => {
            ev.stopPropagation();
            $carousel.carousel($(ev.currentTarget).index());
        });
        $carousel.find('.carousel-control-next').on('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            $carousel.carousel('next');
        });
        $carousel.find('.carousel-control-prev').on('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            $carousel.carousel('prev');
        });
    },
};

let OwlMixin = {
    jsLibs: ['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js'],
    initializeOwlSlider: function (ppr, isTwoColLayout) {
        let responsive = {0: {items: 1}, 576: {items: 2}, 768: {items: 3}, 992: {items: 3}, 1200: {items: ppr}};
        if (isTwoColLayout) {
            responsive = {0: {items: 1}, 576: {items: ppr}};
        }
        this.$('.BeanBakery_product_slider').owlCarousel({
            dots: false,
            margin: 20,
            stagePadding: 5,
            rewind: true,
            rtl: _t.database.parameters.direction === 'rtl',
            nav: true,
            navText: ['<i class="dri dri-arrow-left-l"></i>', '<i class="dri dri-arrow-right-l"></i>'],
            responsive: responsive
        });
    }
};

let ProductsBlockMixins = {
    _setCamelizeAttrs: function () {
        this._super.apply(this, arguments);
        this.selectionType = false;
        if (this.selectionInfo) {
            this.selectionType = this.selectionInfo.selectionType;
        }
    },
    /**
    * @private
    */
    _getDomain: function () {
        let domain = false;
        switch (this.selectionType) {
            case 'manual':
                if (this.selectionInfo.recordsIDs) {
                    domain = [['id', 'in', this.selectionInfo.recordsIDs]];
                }
                break;
            case 'advance':
                if (_.isArray(this.selectionInfo.domain_params.domain)) {
                    domain = this.selectionInfo.domain_params.domain;
                }
                break;
        }
        return domain ? domain : this._super.apply(this, arguments);
    },
    /**
    * @private
    */
    _getLimit: function () {
        return (this.selectionType === 'advance' ? this.selectionInfo.domain_params.limit || 5 : this._super.apply(this, arguments));
    },
    /**
    * @private
    */
    _getSortBy: function () {
        return (this.selectionType === 'advance' ? this.selectionInfo.domain_params.sortBy : this._super.apply(this, arguments));
    },
    /**
    * @private
    */
    _getProducts: function (data) {
        let {products} = data;
        let selectionInfo = this.selectionInfo;
        if (selectionInfo && selectionInfo.selectionType === 'manual') {
            products = _.map(selectionInfo.recordsIDs, function (productID) {
                return _.findWhere(data.products, {id: productID}) || false;
            });
        }
        return _.compact(products);
    },
    /**
    * @private
    */
    _processData: function (data) {
        this._super.apply(this, arguments);
        return this._getProducts(data);
    },
};

let HotspotMixns = {
    _getHotspotConfig: function () {
        if (this.$target.get(0).dataset.hotspotType === 'static') {
            return {titleText: this.$target.get(0).dataset.titleText, subtitleText: this.$target.get(0).dataset.subtitleText, buttonLink: this.$target.get(0).dataset.buttonLink, hotspotType: this.$target.get(0).dataset.hotspotType, buttonText: this.$target.get(0).dataset.buttonText, imageSrc: this.$target.get(0).dataset.imageSrc};
        }
        return {};
    },
    _isPublicUser: function () {
        return _.has(odoo.dr_theme_config, "is_public_user") && odoo.dr_theme_config.is_public_user;
    },

    _cleanNodeAttr: function () {
        if (this._isPublicUser()) {
            let attrs = ['data-image-src', 'data-hotspot-type', 'data-title-text', 'data-subtitle-text', 'data-button-link', 'data-button-text', 'data-top', 'data-on-hotspot-click'];
            attrs.forEach(attr => {this.$target.removeAttr(attr)});
        }
    },
};

let CategoryPublicWidgetMixins = {

    _setCamelizeAttrs: function () {
        this._super.apply(this, arguments);
        if (this.selectionInfo) {
            var categoryIDs = this.selectionInfo.recordsIDs;
            // first category
            this.initialCategory = categoryIDs.length ? categoryIDs[0] : false;
        }
    },
    /**
     * @private
     * @returns {Array} options
     */
    _getOptions: function () {
        var options = this._super.apply(this, arguments) || {};
        if (!this.initialCategory) {
            return false;
        }
        var categoryIDs = this.selectionInfo.recordsIDs;
        options['order'] = this.uiConfigInfo.sortBy;
        options['limit'] = this.uiConfigInfo.limit;
        // category name id vadi dict first time filter render karva mate
        options['get_categories'] = true;
        options['categoryIDs'] = categoryIDs;
        options['categoryID'] = this.initialCategory;
        return options;
    },
    /**
     * @private
     * @returns {Array} domain
     */
    _getDomain: function () {
        if (!this.initialCategory) {
            return false;
        }
        var operator = '=';
        if (this.uiConfigInfo.includesChild) {
            operator = 'child_of';
        }
        return [['public_categ_ids', operator, this.initialCategory]];
    },
};

var CartManagerMixin = {

    _handleCartConfirmation: function (cartFlow, data) {
        cartFlow = cartFlow == 'default'? 'notification' : cartFlow;
        var methodName = _.str.sprintf('_cart%s', _.str.classify(cartFlow));
        return this[methodName](data);
    },

    _cartNotification: function (data) {
        this.displayNotification({
            className: 'tp-notification tp-bg-soft-primary o_animate',
            messageIsHtml: true,
            message: Markup(qweb.render('BeanBakeryNotification', { color: 'primary', productID: data.product_id, productName: data.product_name, message: _t('Added to your cart.')})),
            buttons: [{text: _t('View cart'), click: () => {window.location = '/shop/cart';}}, {text: _t('Checkout'), click: () => {window.location = '/shop/checkout?express=1';}}],
        });
    },

    _cartDialog: function (data) {
        new ConfirmationDialog(this, {data: data, size: 'medium'}).open();
    },

    _cartSideCart: function (data) {
        new CartSidebar(this).open();
    },

    _customCartSubmit: function (params) {
        params.force_create = true;
        params.dr_cart_flow = odoo.dr_theme_config.cart_flow || 'notification';
        return this._rpc({
            route: "/shop/cart/update_json",
            params: params,
        }).then(async data => {
            updateCartNavBar(data);
            this.$el.trigger('dr_close_dialog', {});
            return this._handleCartConfirmation(params.dr_cart_flow, data);
        });
    },
};

return {
    BeanBakeryUtils: BeanBakeryUtils,
    HotspotMixns: HotspotMixns,
    SortableMixins: SortableMixins,
    ProductCarouselMixins: ProductCarouselMixins,
    CategoryPublicWidgetMixins: CategoryPublicWidgetMixins,
    OwlMixin: OwlMixin,
    ProductsBlockMixins: ProductsBlockMixins,
    CartManagerMixin: CartManagerMixin,
    cartMixin: cartMixin,
    MarkupRecords: MarkupRecords,
};
});
