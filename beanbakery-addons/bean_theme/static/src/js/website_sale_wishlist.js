odoo.define('bean_theme.wishlist', function (require) {
"use strict";

const publicWidget = require('web.public.widget');
require('website_sale_wishlist.wishlist');

publicWidget.registry.ProductWishlist.include({
    events: _.extend({
        'click .wishlist-section .tp_wish_rm': '_onClicktpRemoveWishlistItem',
        'click .wishlist-section .tp_wish_add': '_onClicktpAddWishlistItem',
    }, publicWidget.registry.ProductWishlist.prototype.events),

    _onClicktpAddWishlistItem: function (ev) {
        this.$('.wishlist-section .tp_wish_add').addClass('disabled');
        this._tpAddOrMoveWishlistItem(ev).then(() => this.$('.wishlist-section .tp_wish_add').removeClass('disabled'));
    },
    _onClicktpRemoveWishlistItem: function (ev) {
        this._tpRemoveWishlistItem(ev, false);
    },
    _tpAddOrMoveWishlistItem: function (e) {
        const $tpWishlistItem = $(e.currentTarget).parents('.tp-wishlist-item');
        const productID = $tpWishlistItem.data('product-id');

        if ($('#b2b_wish').is(':checked')) {
            return this._addToCart(productID, 1);
        } else {
            const addingDeffered = this._addToCart(productID, 1);
            this._tpRemoveWishlistItem(e, addingDeffered);
            return addingDeffered;
        }
    },
    _tpRemoveWishlistItem: function (e, deferred_redirect) {
        const $tpWishlistItem = $(e.currentTarget).parents('.tp-wishlist-item');
        const productID = $tpWishlistItem.data('product-id');
        const wishID = $tpWishlistItem.data('wish-id');

        this._rpc({
            route: '/shop/wishlist/remove/' + wishID,
        }).then(() => $tpWishlistItem.hide());

        this.wishlistProductIDs = _.without(this.wishlistProductIDs, productID);
        if (this.wishlistProductIDs.length === 0) {
            if (deferred_redirect) {
                deferred_redirect.then(() => this._redirectNoWish());
            }
        }
        this._updateWishlistView();
    },
    _updateWishlistView: function () {
        this._super.apply(this, arguments);

        const wishlistCount = this.wishlistProductIDs.length;
        $('.tp-wishlist-counter').text(wishlistCount);
        $('.o_wsale_my_wish.tp-btn-in-bottom-bar').removeClass('d-none');
    }
});

});
