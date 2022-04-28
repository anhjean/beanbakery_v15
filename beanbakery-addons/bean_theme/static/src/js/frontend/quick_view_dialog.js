odoo.define('bean_theme.product_quick_view', function (require) {
'use strict';

require('website_sale_comparison.comparison');
const ajax = require('web.ajax');
const Dialog = require('web.Dialog');
const publicWidget = require('web.public.widget');
const { ProductCarouselMixins } = require('bean_theme.mixins');
const OwlDialog = require('web.OwlDialog');

const QuickViewDialog = Dialog.extend(ProductCarouselMixins, {
    events: _.extend({}, Dialog.prototype.events, {
        'dr_close_dialog': 'close'
    }),
    /**
     * @constructor
     */
    init: function (parent, options) {
        this.productID = options.productID;
        this.variantID = options.variantID || false;
        this.mini = options.mini || false;
        this._super(parent, _.extend({ renderHeader: false, renderFooter: false, technical: false, size: 'extra-large', backdrop: true }, options || {}));
    },
    willStart: function () {
        var quickView = ajax.jsonRpc('/bean_theme/get_quick_view_html', 'call', {
            options: {productID: this.productID, variantID: this.variantID, mini: this.mini}
        });
        return Promise.all([quickView, this._super(...arguments)]).then((result) => {
            if (result[0]) {
                this.$content = $(result[0]);
                this.autoAddProduct = this.mini && this.$content.hasClass('auto-add-product'); // We will not open the dialog for the single varint in mini view
                if (this.autoAddProduct) {
                    this.trigger('tp_auto_add_product');
                }
            }
        });
    },
    /**
     * @override
     */
    start: function () {
        // Append close button to dialog
        $('<button/>', {class: 'close', 'data-dismiss': "modal", html: '<i class="fa fa-times"/>'}).prependTo(this.$modal.find('.modal-content'));
        this.$modal.find('.modal-dialog').addClass('modal-dialog-centered d_product_quick_view_dialog tp-custom-dialog');
        if (this.mini) {
            this.$modal.find('.modal-dialog').addClass('is_mini');
        }
        $(this.$content).appendTo(this.$el);
        this._bindEvents(this.$el);
        this.trigger_up('widgets_start_request', {
            $target: this.$el,
        });
        return this._super.apply(this, arguments);
    },
    open: function (options) {
        $('.tooltip').remove(); // remove open tooltip if any to prevent them staying when modal is opened

        var self = this;
        this.appendTo($('<div/>')).then(function () {
            if (!self.autoAddProduct) {
                self.$modal.find(".modal-body").replaceWith(self.$el);
                self.$modal.attr('open', true);
                self.$modal.removeAttr("aria-hidden");
                self.$modal.modal().appendTo(self.container);
                self.$modal.focus();
                self._openedResolver();

                // Notifies OwlDialog to adjust focus/active properties on owl dialogs
                OwlDialog.display(self);
            }
        });
        if (options && options.shouldFocusButtons) {
            self._onFocusControlButton();
        }
        return self;
    },
});

publicWidget.registry.d_product_quick_view = publicWidget.Widget.extend({
    selector: '.tp-product-quick-view-action, .tp_hotspot[data-on-hotspot-click="modal"]',
    read_events: {
        'click': '_onClick',
    },
    /**
     * @private
     * @param  {Event} ev
     */
    _onClick: function (ev) {
        this.QuickViewDialog = new QuickViewDialog(this, {
            productID: parseInt($(ev.currentTarget).attr('data-product-id'))
        }).open();
    },
});

return QuickViewDialog;

});
