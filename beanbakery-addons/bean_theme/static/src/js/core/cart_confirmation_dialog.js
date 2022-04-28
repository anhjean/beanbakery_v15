odoo.define('bean_theme.cart_confirmation_dialog', function (require) {
'use strict';

    var Dialog = require('web.Dialog');

    return Dialog.extend({
        xmlDependencies: Dialog.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/core/cart_confirmation_dialog.xml', '/bean_theme/static/src/xml/frontend/2_col_deal.xml']),
        template: 'bean_theme.cart_confirmation_dialog',
        events: _.extend({}, Dialog.prototype.events, {
            'dr_close_dialog': 'close',
            'click .s_d_product_small_block .card': '_onClickProduct'
        }),
        /**
         * @constructor
         */
        init: function (parent, options) {
            this.data = options.data;
            if (this.data.accessory_product_ids.length) {
                this.data.accessory_product_ids_str = JSON.stringify(this.data.accessory_product_ids);
            }
            this._super(parent, _.extend({renderHeader: false, renderFooter: false, technical: false, size: options.size, backdrop: true}, options || {}));
        },
        /**
         * @override
         */
        start: function () {
            var sup = this._super.apply(this, arguments);
            // Append close button to dialog
            $('<button/>', {
                class: 'close',
                'data-dismiss': "modal",
                html: '<i class="fa fa-times"/>',
            }).prependTo(this.$modal.find('.modal-content'));
            this.$modal.find('.modal-dialog').addClass('modal-dialog-centered tp-custom-dialog d_cart_confirmation_dialog');
            if (this.mini) {
                this.$modal.find('.modal-dialog').addClass('is_mini');
            }
            this.trigger_up('widgets_start_request', {
                $target: this.$('.s_d_product_small_block'),
            });
            return sup;
        },

        // TODO: fix this hack
        _onClickProduct: function (ev) {
            window.location.href = $(ev.currentTarget).find('.d-product-name a')[0].href;
        },
    });

});
