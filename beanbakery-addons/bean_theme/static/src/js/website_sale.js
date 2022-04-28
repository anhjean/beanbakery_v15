odoo.define('bean_theme.website_sale', function (require) {
'use strict';

require('website_sale.website_sale');
const publicWidget = require('web.public.widget');
const concurrency = require('web.concurrency');
const sAnimations = require('website.content.snippets.animation');
const Dialog = require('web.Dialog');
const config = require('web.config');
const { _t, qweb } = require('web.core');
const { ProductCarouselMixins } = require('bean_theme.mixins');

const isMobileEnv = config.device.size_class <= config.device.SIZES.LG && config.device.touch;

publicWidget.registry.WebsiteSale.include({
    xmlDependencies: (publicWidget.registry.WebsiteSale.prototype.xmlDependencies || []).concat(
        ['/bean_theme/static/src/xml/shop.xml']
    ),
    events: _.extend({}, publicWidget.registry.WebsiteSale.prototype.events || {}, {
        'submit form.js_attributes': '_onFormSubmit',
        'click .tp-filter-sidebar-toggle': '_onClickToggleSidebar',
        'click .tp-sidebar-backdrop': '_onClickToggleSidebar',
    }),
    init: function () {
        this._super.apply(this, arguments);
        this.selectorToReplace = ['.tp-shop-topbar', '.o_wsale_products_main_row'];
        this.dp = new concurrency.DropPrevious();
        $('.tp-filter-bottom-sidebar-toggle').on('click', this._onClickToggleSidebar.bind(this)); // JAT: To work for bottombar
    },
    _startZoom: function () {
        // Disable zoomOdoo, Because we have Drift
    },
    _onChangeCombination: function (ev, $parent, combination) {
        this._super.apply(this, arguments);
        // Stick add to cart
        const $stickyAddToCart = $('.tp-sticky-add-to-cart');
        if ($stickyAddToCart.length) {
            $stickyAddToCart.find('.oe_currency_value').text(this._priceToStr(combination.price));
            $stickyAddToCart.find('.product-img').attr('src', '/web/image/product.product/' + combination.product_id + '/image_128');
            $stickyAddToCart.find('.product-add-to-cart').removeClass('disabled');
            if (['always', 'threshold'].includes(combination.inventory_availability)) {
                if (!combination.virtual_available) {
                    $stickyAddToCart.find('.product-add-to-cart').addClass('disabled');
                }
            }
        }
        // Discount percentage
        const $price = $parent.find('h4.css_editable_mode_hidden');
        let $percentage = $parent.find('.tp-discount-percentage');
        if (combination.has_discounted_price) {
            const percentage = Math.round((combination.list_price - combination.price) / combination.list_price * 100);
            if (percentage) {
                const percentageText = _.str.sprintf(_t('(%d%% OFF)'), percentage);
                if ($percentage.length) {
                    $percentage.text(percentageText);
                } else {
                    $percentage = $('<small class="tp-discount-percentage d-none d-md-inline-block ml-1">' + percentageText + '</small>');
                    $percentage.appendTo($price);
                }
            } else {
                $percentage.remove();
            }
        } else {
            $percentage.remove();
        }
    },
    _updateProductImage: function ($productContainer, displayImage, productId, productTemplateId, newCarousel, isCombinationPossible) {
        var $carousel = $productContainer.find('.d_shop_product_details_carousel');
        if ($carousel.length) {
            if (window.location.search.indexOf('enable_editor') === -1) {
                var $newCarousel = $(newCarousel);
                $carousel.after($newCarousel);
                $carousel.remove();
                $carousel = $newCarousel;
                $carousel.carousel(0);
                this._startZoom();
                this.trigger_up('widgets_start_request', {$target: $carousel});
                ProductCarouselMixins._bindEvents($productContainer);
            }
            $carousel.toggleClass('css_not_available', !isCombinationPossible);
        } else {
            $carousel = $productContainer.find('#o-carousel-product');
            this._super.apply(this, arguments);
        }

        let $container = $productContainer.parents('.tp-show-variant-image');
        if ($container.length) {
            let src = $carousel.find('.tp-drift-zoom-img:first').attr('src');
            if (src !== $container.find('.tp-variant-image').attr('src')) {
                $container.find('.tp-variant-image').fadeOut(400);
                _.delay(function () {$container.find('.tp-variant-image').attr('src', src).fadeIn(650);}, 400);
            }
        }
    },
    _onClickToggleSidebar: function (ev) {
        ev.preventDefault();
        this._toggleSidebar();
    },
    _toggleSidebar: function () {
        this.$('.tp-sidebar-backdrop').removeClass('show d-block');
        if (this.$('#products_grid_before').hasClass('open')) {
            this.$('#products_grid_before').removeClass('open');
            $('#wrapwrap').css('z-index', 0);
        } else {
            this.$('.tp-sidebar-backdrop').addClass('show d-block');
            this.$('#products_grid_before').addClass('open');
            $('#wrapwrap').css('z-index', 'unset');
        }
        this.$('.tp-filter-sidebar-item').toggleClass('show d-none');
    },
    _onChangeAttribute: function (ev) {
        if (!ev.currentTarget.classList.contains('tp-search')) {
            this._super.apply(this, arguments);
        }
    },
    _onFormSubmit: function (ev) {
        if (odoo.dr_theme_config.json_shop_filters.filter_method !== 'lazy') {
            return;
        }
        document.getElementById('wrapwrap').scrollTo({top: 0, behavior: 'smooth'});
        const isSidebarOpen = this.$('#products_grid_before').hasClass('open');
        if (isSidebarOpen) {
            this._toggleSidebar();
        }
        ev.preventDefault();
        this.$('#products_grid').empty();
        this.$shopLoader = $(qweb.render('bean_theme.ShopLoader'));
        this.$shopLoader.appendTo(this.$('#products_grid'));
        const $form = $(ev.currentTarget).closest('form');
        const url = window.location.pathname + '?' + $form.serialize();
        window.history.pushState({}, '', url);
        this.dp.add(
            new Promise(function (resolve, reject) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    success: function (data) {
                        resolve(data);
                    }
                });
            })
        ).then(data => {
            this._replaceShopContent(data);
            this.trigger_up('widgets_start_request', {
                $target: this.$el,
            });
            this.$shopLoader.remove();
            $('.tp-filter-bottom-sidebar-toggle').on('click', this._onClickToggleSidebar.bind(this));
        });
    },
    _replaceShopContent: function (data) {
        this.selectorToReplace.forEach(selector => {
            this.$(selector).replaceWith($(data).find(selector));
        });
    },
});

//------------------------------------------------------------------------------
// Shop Page
//------------------------------------------------------------------------------
publicWidget.registry.TpSelectedAttributes = publicWidget.Widget.extend({
    selector: '.tp-selected-attributes',
    events: {
        'click .tp-attribute': '_onClickAttribute'
    },
    init: function () {
        this._super.apply(this, arguments);
        this.$form = $('.js_attributes');
    },
    _onClickAttribute: function (ev) {
        if (ev.currentTarget.classList.contains('clear')) {
            this.el.querySelectorAll('.tp-attribute').forEach(el => {
                this._deactivateFilter(el);
            });
            this.$form.submit();
            return;
        }
        this._deactivateFilter(ev.currentTarget);
        this.$form.submit();
    },
    _deactivateFilter: function (el) {
        const type = el.dataset.type;
        const id = el.dataset.id;
        if (type === 'price') {
            this.$form.find('input[name=min_price]').remove();
            this.$form.find('input[name=max_price]').remove();
        }
        const $input = this.$form.find('input[id=' + id + ']');
        $input.prop('checked', false);
        const $select = this.$form.find('option[id=' + id + ']').closest('select');
        $select.val('');
    }
});

publicWidget.registry.TpFilterAttribute = publicWidget.Widget.extend({
    selector: '.tp-filter-attribute',
    events: {
        'input .tp-search': '_onChangeSearch',
        'click .tp-filter-attribute-title.collapsible': '_onClickFilterAttributeTitle',
    },
    _onChangeSearch: function (ev) {
        ev.stopPropagation();
        const value = ev.currentTarget.value.trim();
        if (value) {
            this.el.querySelectorAll('li[data-search-term]').forEach(el => {
                el.classList.add('d-none');
            });
            this.el.querySelectorAll('li[data-search-term*="' + value.toLowerCase() + '"]').forEach(el => {
                el.classList.remove('d-none');
            });
        } else {
            this.el.querySelectorAll('li[data-search-term]').forEach(el => {
                el.classList.remove('d-none');
            });
        }
    },
    _onClickFilterAttributeTitle: function (ev) {
        if ($(ev.currentTarget).hasClass('expanded')) {
            $(ev.currentTarget).siblings('.tp-filter-attribute-collapsible-area').slideUp('fast');
        } else {
            $(ev.currentTarget).siblings('.tp-filter-attribute-collapsible-area').slideDown('fast');
        }
        $(ev.currentTarget).toggleClass('expanded');
    },
});

publicWidget.registry.TpRangeFilter = publicWidget.Widget.extend({
    selector: '.tp-range-filter',
    jsLibs: ['/bean_theme/static/lib/ion.rangeSlider-2.3.1/js/ion.rangeSlider.js'],
    cssLibs: ['/bean_theme/static/lib/ion.rangeSlider-2.3.1/css/ion.rangeSlider.css'],
    events: {
        'change input.min': '_onChangeInput',
        'change input.max': '_onChangeInput',
        'click .apply': '_onClickApply',
    },
    start: function () {
        this.$slider = this.$('.tp-slider');
        this.$slider.ionRangeSlider({
            skin: 'square',
            prettify_separator: ',',
            type: 'double',
            hide_from_to: true,
            onChange: ev => {
                this.$('input.min').val(ev.from);
                this.$('input.max').val(ev.to);
                this.$('.tp-validate-msg').text('');
                this.$('.apply').removeClass('d-none');
            },
        });
        this.key = this.$slider.data('key');
        this.slider = this.$slider.data('ionRangeSlider');
        return this._super.apply(this, arguments);
    },
    _onChangeInput: function (ev) {
        ev.preventDefault();
        const minValue = this.$('input.min').val();
        const maxValue = this.$('input.max').val();

        if (isNaN(minValue) || isNaN(maxValue)) {
            this.$('.tp-validate-msg').text(_t('Enter valid value.'));
            this.$('.apply').addClass('d-none');
            return false;
        }
        if (parseInt(minValue) > parseInt(maxValue)) {
            this.$('.tp-validate-msg').text(_t('Maximum value should be greater than minimum.'));
            this.$('.apply').addClass('d-none');
            return false;
        }
        this.slider.update({
            from: minValue,
            to: maxValue,
        });
        this.$('.tp-validate-msg').text('');
        this.$('.apply').removeClass('d-none');
        return false;
    },
    _onClickApply: function (ev) {
        this.$('input[name=min_' + this.key + ']').remove();
        this.$('input[name=max_' + this.key + ']').remove();
        if (this.slider.result.from !== this.slider.result.min) {
            this.$el.append($('<input>', {type: 'hidden', name:'min_' + this.key, value: this.slider.result.from}));
        }
        if (this.slider.result.to !== this.slider.result.max) {
            this.$el.append($('<input>', {type: 'hidden', name:'max_' + this.key, value: this.slider.result.to}));
        }
    },
});

//------------------------------------------------------------------------------
// Product Detail Page
//------------------------------------------------------------------------------
publicWidget.registry.websiteSaleCarouselProduct.include({
    _updateJustifyContent: function () {
        this._super.apply(this, arguments);
        const $indicatorsDiv = this.$target.find('.carousel-indicators');
        $indicatorsDiv.css('justify-content', 'center');
    },
});

publicWidget.registry.TpDriftZoom = publicWidget.Widget.extend({
    selector: '.tp-drift-zoom',
    disabledInEditableMode: true,
    jsLibs: ['/bean_theme/static/lib/drift-master-1.4.0/dist/Drift.js'],
    cssLibs: ['/bean_theme/static/lib/drift-master-1.4.0/dist/drift-basic.css'],
    start: function () {
        this.images = [];
        const className = _t.database.parameters.direction === 'rtl' ? 'tp-rtl' : 'tp';
        const zoomConfig = odoo.dr_theme_config.json_zoom;
        if (zoomConfig.zoom_enabled) {
            this.el.querySelectorAll('.tp-drift-zoom-img').forEach((el, index) => {
                const imageVals = {namespace: className, sourceAttribute: 'src', inlineOffsetY: -50, paneContainer: el.parentElement, zoomFactor: zoomConfig.zoom_factor || 2, inlinePane: 992, touchDelay: 500};
                const bigImage = el.dataset.zoomImage;
                if (bigImage) {
                    imageVals.sourceAttribute = 'data-zoom-image';
                }
                if (zoomConfig.disable_small && !bigImage) {
                    return false;
                }
                this.images.push(new Drift(el, imageVals));
            });
        }
        return this._super.apply(this, arguments);
    },
    destroy: function () {
        this.images.forEach(drift => {
            drift.disable();
        });
        this._super.apply(this, arguments);
    }
});

publicWidget.registry.TpProductRating = publicWidget.Widget.extend({
    selector: '.oe_website_sale .o_product_page_reviews_link',
    events: {
        'click': '_onClickProductRating',
    },
    _onClickProductRating: function () {
        $('.nav-link[href="#tp-product-rating-tab"]').click();
        $('html, body').animate({scrollTop: $('.tp-product-details-tab').offset().top});
    }
});

publicWidget.registry.TpProductDetailsTab = publicWidget.Widget.extend({
    selector: '.tp-product-details-tab',
    start: function () {
        this.$('> ul.nav-tabs > li.nav-item > a.nav-link').removeClass('active');
        this.$('> ul.nav-tabs > li.nav-item:first > a.nav-link').addClass('active');
        this.$('> .tab-content .tab-pane').removeClass('active show');
        this.$('> .tab-content .tab-pane:first').addClass('active show');
        return this._super.apply(this, arguments);
    }
});

publicWidget.registry.TpLazyDialog = publicWidget.Widget.extend({
    selector: '.tp-lazy-dialog',
    events: {
        'click': '_onClick',
    },
    init: function () {
        this.dialogContent = false;
        this._super.apply(this, arguments);
    },
    _onClick: async function (ev) {
        ev.preventDefault();
        const { resId, resModel, field } = this.el.dataset;
        if (!this.dialogContent) {
            const result = await this._rpc({
                route: '/bean_theme/get_dialog_content',
                params: {
                    res_id: resId,
                    res_model: resModel,
                    fields: [field],
                },
            });
            if (result && result[0][field]) {
                this.dialogContent = result[0][field];
            }
        }
        this.dialog = new Dialog(this, {
            technical: false,
            $content: $('<div/>').html(this.dialogContent),
            dialogClass: 'p-0',
            renderFooter: false,
        }).open();
        this.dialog.opened().then(() => {
            this.dialog.$modal.find('.modal-dialog').addClass('modal-dialog-centered');
            this.dialog.$modal.addClass('tp-lazy-dialog-modal');
            this.trigger_up('widgets_start_request', {
                $target: this.dialog.$modal,
                editableMode: this.editableMode
            });
        });
    },
});

sAnimations.registry.TpStickyAddToCart = sAnimations.Animation.extend({
    selector: '.tp-sticky-add-to-cart',
    disabledInEditableMode: true,
    effects: [{
        startEvents: 'scroll',
        update: '_onScroll',
    }],
    events: {
        'click .product-add-to-cart': '_onClickProductAddToCart',
        'click .product-img': '_onClickImg'
    },
    _onScroll: function () {
        if (!isMobileEnv && $('#add_to_cart').length) {
            if ($('#add_to_cart')[0].getBoundingClientRect().top <= 0) {
                this.$el.fadeIn();
            } else {
                this.$el.fadeOut();
            }
        }
    },
    _onClickProductAddToCart: function (ev) {
        ev.preventDefault();
        const event = new MouseEvent('click', { view: window, bubbles: true });
        $('#add_to_cart')[0].dispatchEvent(event);
    },
    _onClickImg: function (ev) {
        ev.preventDefault();
        $('html, body').animate({ scrollTop: 0 });
    }
});

//------------------------------------------------------------------------------
// Brand Page
//------------------------------------------------------------------------------
publicWidget.registry.TpBrandPage = publicWidget.Widget.extend({
    selector: '.tp-all-brands-page',
    events: {
        'click .tp-brand-search-alphabet': '_onClickBrandSearchAlphabet',
    },
    _onClickBrandSearchAlphabet: function (ev) {
        this.el.querySelectorAll('.tp-brand-search-alphabet').forEach(el => {
            el.classList.remove('active');
        });
        ev.currentTarget.classList.add('active');
        const searchAlphabet = ev.currentTarget.dataset.alphabet;
        if (searchAlphabet === 'all') {
            this.el.querySelectorAll('.tp-grouped-brands').forEach(el => {
                el.classList.remove('d-none');
            });
        } else {
            this.el.querySelectorAll('.tp-grouped-brands').forEach(el => {
                el.classList.add('d-none');
            });
            this.el.querySelector('.tp-grouped-brands[data-brand=' + searchAlphabet + ']').classList.remove('d-none');
        }
    }
});

});
