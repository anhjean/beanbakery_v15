/** @odoo-module alias=bean_theme.website_cart_manager **/
"use strict";

import WebsiteSale from 'website_sale_options.website_sale'; // for dependencies
import publicWidget from 'web.public.widget';
import {CartManagerMixin} from 'bean_theme.mixins';
import QuickViewDialog from 'bean_theme.product_quick_view';

publicWidget.registry.WebsiteSale.include(_.extend({}, CartManagerMixin, {
        xmlDependencies: (publicWidget.registry.WebsiteSale.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/notification_template.xml']),
        _onProductReady: function () {
            if (this._isDefaultCartFLow() || this.isBuyNow) {
                return this._super.apply(this, arguments);
            }

            /*  We assume is qty selector is not present the it will not have the
                variant selector so `variantSelectorNeeded` variable used to indicate
                that should we open custom selector or not.
            */
            var variantSelectorNeeded = !this.$form.find('input[name="add_qty"]').length;
            if (variantSelectorNeeded) {
                var dialogOptions = {mini: true, size: 'small'};
                var productID = this.$form.find('.product_template_id').val();
                if (productID) {
                    dialogOptions['productID'] = parseInt(productID);
                } else {
                    dialogOptions['variantID'] = this.rootProduct.product_id;
                }
                this.QuickViewDialog = new QuickViewDialog(this, dialogOptions);
                this.QuickViewDialog.open();
                this.QuickViewDialog.on('tp_auto_add_product', null, this._submitForm.bind(this));
                return this.QuickViewDialog.opened();
            }
            return this._submitForm();
        },
        _submitForm() {
            if (this.QuickViewDialog) {
                this.QuickViewDialog._openedResolver();
            }
            return this._super(...arguments);
        },
        _isDefaultCartFLow: function () {
            return !_.contains(['side_cart', 'dialog', 'notification'], odoo.dr_theme_config.cart_flow);
        },
        addToCart(params) {
            if (this.isBuyNow || this._isDefaultCartFLow()) {
                return this._super.apply(this, arguments);
            } else {
                return this._customCartSubmit(params);
            }
        },
        _setUrlHash: function ($parent) {
            if (this.$el.hasClass('tp-no-attr-hash')) {
                return;
            }
            return this._super.apply(this, arguments);
        },
}));
