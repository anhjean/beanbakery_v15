odoo.define('bean_theme.product.root.widget', function (require) {
'use strict';

require('website_sale.utils');
const config = require('web.config');
const {qweb, _t} = require('web.core');
const RootWidget = require('bean_theme.root.widget');
const QuickViewDialog = require('bean_theme.product_quick_view');
const { cartMixin, CartManagerMixin , MarkupRecords} = require('bean_theme.mixins');
let { Markup } = require('web.utils');

return RootWidget.extend(cartMixin, CartManagerMixin, MarkupRecords, {

    xmlDependencies: (RootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/notification_template.xml']),

    snippetNodeAttrs: (RootWidget.prototype.snippetNodeAttrs || []).concat(['data-ui-config-info']),
    tpFieldsToMarkUp: ['price', 'rating', 'list_price', 'label_template'],

    read_events: {
        'click .d_add_to_cart_btn': '_onAddToCartClick',
        'click .d_add_to_wishlist_btn': '_onAddToWishlistClick',
        'click .d_product_quick_view': '_onProductQuickViewClick',
    },
    events: {
        'mouseenter .d_product_thumb_img': '_onMouseEnter',
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
    * @private
    */
    _getOptions: function () {
        let options = {};
        // add new attribute to widget or just set data-userParams to $target
        if (this.uiConfigInfo) {
            if (this._isActionEnabled('wishlist')) {
                options['wishlist_enabled'] = true;
            }
            // fetch shop config only if 'wishlist', 'comparison', 'rating'
            // any one of this is enabled in current snippet
            if (this._anyActionEnabled(this._getMustDisabledOptions())) {
                options['shop_config_params'] = true;
            }
            return options;
        } else {
            return this._super.apply(this, arguments);
        }
    },
    /**
    * Check any given option is enabled(true) in userParams.
    * e.g. this.uiConfigInfo.wishlist = true;
    * this method return true if any one of given option is true
    * @private
    */
    _anyActionEnabled: function (actions) {
        return _.intersection(actions, this.uiConfigInfo.activeActions).length >= 1;
    },
    /**
     * @private
     */
    _getAllActions: function () {
        return ['wishlist', 'comparison', 'add_to_cart', 'quick_view'];
    },
    /**
    * @private
    * @see _getMustDisabledOptions of configurator
    */
    _getMustDisabledOptions: function () {
        return ['wishlist', 'comparison', 'rating'];
    },
    /**
     * init tooltips
     *
     * @private
     */
    _initTips: function () {
        this.$('[data-toggle="tooltip"]').tooltip();
    },
    /**
     * @private
     */
    _isActionEnabled: function (actionName, actions) {
        let allActions = actions || this.uiConfigInfo.activeActions;
        return _.contains(allActions, actionName);
    },
    /**
     * @override
     */
    _modifyElementsAfterAppend: function () {
        let self = this;
        this._initTips();
        _.each(this.wishlistProductIDs, function (id) {
            self.$('.d_add_to_wishlist_btn[data-product-product-id="' + id + '"]').prop("disabled", true).addClass('disabled');
        });
        // [HACK] must be improve in next version.
        // Dev like it will work on both (shop and snippet)
        // Also in snippet only show similar_products buttons if similar_products exist
        if (this.uiConfigInfo && this._isActionEnabled('show_similar')) {
            this.trigger_up('widgets_start_request', {$target: this.$('.tp_show_similar_products')});
        }
        this._super.apply(this, arguments);
    },
    /**
     * @private
     */
    _updateUserParams: function (shopConfigParams) {
        if (this.uiConfigInfo) {
            this._getMustDisabledOptions().forEach(option => {
                let enabledInShop = shopConfigParams['is_' + option + '_active'];
                if (!enabledInShop) {
                    this.uiConfigInfo['activeActions'] = _.without(this.uiConfigInfo.activeActions, option);
                }
            });
            // whether need to render whole container for
            // e.g if all actions are disabled then donot render overlay(contains add to card, wishlist btns etc)
            this.uiConfigInfo['anyActionEnabled'] = this._anyActionEnabled(this._getAllActions());
        }
    },
    /**
    * Method is copy of wishlist public widget
    *
    * @private
    */
    _updateWishlistView: function () {
        if (this.wishlistProductIDs.length > 0) {
            $('.o_wsale_my_wish').show();
            $('.my_wish_quantity').text(this.wishlistProductIDs.length);
        } else {
            $('.o_wsale_my_wish').show();
            $('.my_wish_quantity').text('');
        }
    },
    /**
    * @private
    */
    _setDBData: function (data) {
        if (data.wishlist_products) {
            this.wishlistProductIDs = data.wishlist_products;
        }
        if (data.shop_config_params) {
            this._updateUserParams(data.shop_config_params);
        }
        this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param  {Event} ev
     */
    _onAddToCartClick: function (ev) {
        this.onAddToCartClick(ev, QuickViewDialog);
    },
    /**
     * @private
     * @param  {Event} ev
     */
    _onProductQuickViewClick: function (ev) {
        // set $parentNode to fix bug
        this.QuickViewDialog = new QuickViewDialog(this, {
            productID: parseInt($(ev.currentTarget).attr('data-product-template-id')),
        });
        this.QuickViewDialog.open();
    },
    /**
    * @private
    */
    _removeProductFromWishlist: function (wishlistID, productID) {
        this._rpc({
            route: '/shop/wishlist/remove/' + wishlistID,
        }).then(() => {
            // I hate $
            let className = `.tp-notification.${productID}`;
            $(className).addClass('d-none');
            $(".d_add_to_wishlist_btn[data-product-product-id='" + productID + "']").prop("disabled", false).removeClass('disabled');
            this.wishlistProductIDs = _.filter(this.wishlistProductIDs, function (id) { return id !== productID;});
            this._updateWishlistView();
        });
    },
    /**
     * @private
     * @param  {Event} ev
     */
    _onAddToWishlistClick: function (ev) {
        let productID = parseInt($(ev.currentTarget).attr('data-product-product-id'));
        this._rpc({
            route: '/bean_theme/wishlist_general',
            params: {
                product_id: productID,
            },
        }).then(res => {
            this.wishlistProductIDs = res.products;
            this.displayNotification({
                className: `tp-notification tp-bg-soft-danger ${productID}`,
                messageIsHtml: true,
                message: Markup(qweb.render('BeanBakeryNotification', {color: 'danger', productName: res.name, message: _t('Added to your wishlist.'), iconClass: 'dri dri-wishlist'})),
                buttons: [{text: _t("Wishlist"), click: () => {window.location = '/shop/wishlist';}}, { text: _t("Undo"), click: () => { this._removeProductFromWishlist(res.wishlist_id, productID);}}],
            });
            this._updateWishlistView();
            $(".d_add_to_wishlist_btn[data-product-product-id='" + productID + "']").prop("disabled", true).addClass('disabled');
        });
    },
    _processData: function (data) {
        if (data.products) {
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
        }
        return data;
    },
    /**
     * @private
     */
    _onMouseEnter: function (ev) {
        let $target = $(ev.currentTarget);
        let src = $target.attr('src');
        let productID = $target.attr('data-product-id');
        let $card = this.$('.d_product_card[data-product-id=' + productID + ']');
        $card.find('.d-product-img').attr('src', src);
        $card.find('.d_product_thumb_img').removeClass('d_active');
        $target.addClass('d_active');
    },
    _cleanBeforeAppend: function () {
        if (this.uiConfigInfo && this.uiConfigInfo.mode === 'grid') {
            this._setClass();
        }
    },
    _onWindowResize: function () {
        this._super.apply(this, arguments);
        // Added this.response bcoz odoo is triggering resize from many places and this is totally shit for ex comparison
        // due to this no data template append first sometimes
        if (this.uiConfigInfo && this.uiConfigInfo.mode === 'grid' && this.response) {
            this._setClass();
            this._onSuccessResponse(this.response);
        }
    },
    _setClass: function () {
        let device = config.device;
        this.deviceSizeClass = device.size_class;
        if (this.deviceSizeClass <= 1) {
            this.cardSize = 12;
            this.cardColClass = 'col-' + this.cardSize.toString();
        } else if (this.deviceSizeClass === 2) {
            this.cardSize = 6;
            this.cardColClass = 'col-sm-' + this.cardSize.toString();
        } else if (this.deviceSizeClass === 3 || this.deviceSizeClass === 4) {
            this.cardSize = 4;
            this.cardColClass = 'col-md-' + this.cardSize.toString();
        } else if (this.deviceSizeClass >= 5) {
            this.cardSize = parseInt(12 / this.uiConfigInfo.ppr);
            this.cardColClass = 'col-lg-' + this.cardSize.toString();
        }
    }
});

});
