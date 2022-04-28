odoo.define('bean_theme.sidebar', function (require) {
'use strict';

require('website_sale.cart');
const VariantMixin = require('sale.VariantMixin');
const concurrency = require('web.concurrency');
const publicWidget = require('web.public.widget');
const wSaleUtils = require('website_sale.utils');
const Widget = require('web.Widget');

const Sidebar = Widget.extend({
    events: _.extend({}, Widget.prototype.events, {
        'click .tp-close': 'close',
    }),
    init: function (parent, options) {
        this._super(parent);
        const self = this;
        this._opened = new Promise(function (resolve) {
            self._openedResolver = resolve;
        });
        options = _.defaults(options || {});
        this.$content = options.$content;
        this.leftSide = options.leftSide ? 'left': 'right';
        this.sidebarClass = options.sidebarClass || " " ;
        this.$backdrop = $('<div class="modal-backdrop tp-sidebar-backdrop show d-block"/>');
        this.$backdrop.on('click', this._onClickBackdrop.bind(this));
    },
    willStart: function () {
        const proms = [this._super.apply(this, arguments)];
        proms.push(this._getTemplate().then(template => this.$content = $(template)));
        return Promise.all(proms);
    },
    renderElement: function () {
        this._super.apply(this, arguments);
        if (this.$content) {
            this.setElement(this.$content);
        }
    },
    open: function (options) {
        this.$backdrop.appendTo('body');
        $('body').addClass('modal-open');
        this.appendTo($('<div/>')).then(() => {
            this.$el.appendTo('body')
            this.$el.addClass('tp-sidebar ' + this.leftSide + ' '+ this.sidebarClass);
            this._openedResolver();
            setTimeout(() => {this.$el.addClass('open');}, 100);
        });
        return this;
    },
    opened: function (handler) {
        return (handler)? this._opened.then(handler) : this._opened;
    },
    _onClickBackdrop: function (ev) {
        ev.preventDefault();
        this.close();
    },
    close: function () {
        if (this.$el) {
            this.$el.removeClass('open');
            this.$backdrop.remove();
            $('body').removeClass('modal-open');
            this.$el.remove();
        }
    },
});

const CartSidebar = Sidebar.extend(VariantMixin, {
    events: _.extend({}, Sidebar.prototype.events, {
        'click .tp-remove-line': '_onRemoveLine',
        'click .js_add_cart_json': 'onClickAddCartJSON',
        'change .js_quantity':'_onChangeQty',
    }),
    init: function () {
        this._super.apply(this, arguments);
        this.products = {};
        this._onChangeQty = _.debounce(this._onChangeQty, 200);
        this.dp = new concurrency.DropPrevious();
    },
    _getTemplate: function () {
        return $.get('/shop/cart', { type: 'tp_cart_sidebar_request' });
    },
    _onRemoveLine: function (ev) {
        ev.preventDefault();
        $(ev.currentTarget).closest('.media').find('.js_quantity').val(0).trigger('change');
    },
    async _onChangeQty (ev) {
        const $target = $(ev.currentTarget);
        const quantity = parseInt($target.val());
        this.dp.add(
            this._rpc({
                route: '/shop/cart/update_json',
                params: {
                    product_id: $target.data('productId'),
                    line_id: $target.data('lineId'),
                    set_qty: quantity
                }
            })
        ).then(data => {
            this._refreshCart(data);
        });
    },
    async _refreshCart (data) {
        data['cart_quantity'] = data.cart_quantity || 0;
        wSaleUtils.updateCartNavBar(data);
        const template = await this._getTemplate();
        this.$el.children().remove();
        $(template).children().appendTo(this.$el);
    },
    _onCartSidebarClose: function () {
        this.close();
    },
});

// Disable cart popover
publicWidget.registry.websiteSaleCartLink.include({
    selector: '#top_menu a[href$="/shop/cart"]:not(.tp-cart-sidebar-action)',
});

publicWidget.registry.TpCartSidebarBtn = publicWidget.Widget.extend({
    selector: '.tp-cart-sidebar-action',
    read_events: {
        'click': '_onClick',
    },
    _onClick: function (ev) {
        ev.preventDefault();
        new CartSidebar(this).open();
    },
});

const SearchSidebar = Sidebar.extend({
    _getTemplate: function () {
        return $.get('/bean_theme/search_sidebar');
    },
    start: function () {
        return this._super.apply(this, arguments).then(() => {
            this.trigger_up('widgets_start_request', {
                $target: this.$('.o_searchbar_form'),
            });
            this.$('.o_searchbar_form').removeClass('o_wait_lazy_js');
        });
    },
});

publicWidget.registry.TpSearchSidebarBtn = publicWidget.Widget.extend({
    selector: '.tp-search-sidebar-action',
    read_events: {
        'click': '_onClick',
    },
    _onClick: function (ev) {
        ev.preventDefault();
        new SearchSidebar(this).open();
    },
});

const CategorySidebar = Sidebar.extend({
    _getTemplate: function () {
        return $.get('/bean_theme/get_category_sidebar');
    },
});

publicWidget.registry.TpCategorySidebarBtn = publicWidget.Widget.extend({
    selector: '.tp-category-action',
    read_events: {
        'click': '_onClick',
    },
    _onClick: function (ev) {
        ev.preventDefault();
        new CategorySidebar(this, {sidebarClass: ' bg-100'}).open();
    },
});

const SimilarProductsSidebar = Sidebar.extend({
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.productID = options.productID;
    },
    _getTemplate: function () {
        return $.get('/bean_theme/get_similar_products_sidebar', {productID: this.productID});
    },
});

publicWidget.registry.TpShowSimilarProducts = publicWidget.Widget.extend({
    selector: '.tp_show_similar_products',
    read_events: {
        'click': '_onClick',
    },
    _onClick: function (ev) {
        ev.preventDefault();
        new SimilarProductsSidebar(this, { sidebarClass: ' bg-100', productID: parseInt($(ev.currentTarget).attr('data-product-template-id'))}).open();
    },
});

return {
    Sidebar: Sidebar,
    CartSidebar: CartSidebar,
    SearchSidebar: SearchSidebar,
    CategorySidebar: CategorySidebar,
    SimilarProductsSidebar: SimilarProductsSidebar,
};

});
