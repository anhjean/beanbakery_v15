odoo.define('bean_theme.dynamic_snippets', function (require) {
"use strict";

const {_t, qweb} = require('web.core');
const publicWidget = require('web.public.widget');
const ProductRootWidget = require('bean_theme.product.root.widget');
const RootWidget = require('bean_theme.root.widget');
const config = require('web.config');
const QuickViewDialog = require('bean_theme.product_quick_view');
const sAnimations = require('website.content.snippets.animation');
const { OwlMixin, MarkupRecords, ProductsBlockMixins, CategoryPublicWidgetMixins, ProductCarouselMixins, HotspotMixns, cartMixin} = require('bean_theme.mixins');
require('website.content.menu');

// Hack ODOO is handling hover by self so manually trigger event remove when new bootstrap is merged in ODOO :)

publicWidget.registry.hoverableDropdown.include({
    _onMouseEnter: function (ev) {
        if (config.device.size_class <= config.device.SIZES.SM) {return}
        // currentTarget dropdown
        $(ev.currentTarget).trigger('show.tp.dropdown');
        this._super.apply(this, arguments);
    },
});

// Products Cards
publicWidget.registry.s_d_products_snippet = ProductRootWidget.extend(OwlMixin, ProductsBlockMixins, {
    selector: '.s_d_products_snippet_wrapper',
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/cards.xml', '/bean_theme/static/src/xml/frontend/utils.xml']),

    bodyTemplate: 'd_s_cards_wrapper',
    bodySelector: '.s_d_products_snippet',
    controllerRoute: '/bean_theme/get_products_data',
    fieldstoFetch: ['name', 'price', 'dr_label_id', 'rating', 'public_categ_ids', 'product_variant_ids'],
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),

    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeOwlSlider(this.uiConfigInfo.ppr);
        }
    },
});

publicWidget.registry.s_product_listing_cards_wrapper = ProductRootWidget.extend(ProductsBlockMixins, MarkupRecords, {
    selector: '.s_product_listing_cards_wrapper',
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/listing_cards.xml']),

    bodyTemplate: 'd_s_cards_listing_wrapper',
    bodySelector: '.s_product_listing_cards',
    controllerRoute: '/bean_theme/get_listing_products',
    fieldstoFetch: ['name', 'price', 'rating'],
    _getOptions: function () {
        return _.pick(this.uiConfigInfo || {}, function (value, key, object) {
            return _.contains(['bestseller', 'newArrived', 'discount'], key) && value;
        });
    },
    _processData: function (data) {
        this.numOfCol = 12 / _.keys(data).length;
        this._super.apply(this, arguments);
        let result = [];
        _.each(data, (list, key) => {
            this._markUpValues(this.tpFieldsToMarkUp, list);
            switch (key) {
                case 'bestseller':
                    result.push({title: _t("Best Seller"), products: list});
                    break;
                case 'newArrived':
                    result.push({title: _t("Newly Arrived"), products: list});
                    break;
                case 'discount':
                    result.push({title: _t("On Sale"), products: list});
                    break;
            }
            this._markUpValues(this.tpFieldsToMarkUp, list);
        });
        return result;
    },
    _getLimit: function () {
        return 5;
    }
});

// Countdown snippet
publicWidget.registry.s_d_single_product_count_down = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_d_single_product_count_down_wrapper',

    bodyTemplate: 's_d_single_product_count_down_temp',
    bodySelector: '.s_d_single_product_count_down',

    controllerRoute: '/bean_theme/get_products_data',

    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),

    fieldstoFetch: ['name', 'price', 'offer_data', 'description_sale'],

    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || [])
        .concat(['/bean_theme/static/src/xml/frontend/dynamic_snippets.xml']),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),
    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.trigger_up('widgets_start_request', {
            editableMode: this.editableMode,
            $target: this.$('.tp-countdown')
        });
        this.$('.BeanBakery_product_slider_single_product').owlCarousel({ dots: false, margin: 20, rtl: _t.database.parameters.direction === 'rtl', stagePadding: 5, rewind: true, nav: true, navText: ['<i class="dri dri-arrow-left-l"></i>', '<i class="dri dri-arrow-right-l"></i>'], responsive: {0: {items: 1,},}});
    },
});

publicWidget.registry.s_category_snippet = ProductRootWidget.extend(OwlMixin, MarkupRecords, CategoryPublicWidgetMixins, {
    selector: '.s_d_category_snippet_wrapper',

    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),

    controllerRoute: '/bean_theme/get_products_by_category',
    bodyTemplate: 'd_s_category_cards_wrapper',
    bodySelector: '.s_d_category_snippet',
    fieldstoFetch: ['name', 'price', 'description_sale', 'dr_label_id', 'rating', 'public_categ_ids', 'product_template_image_ids', 'product_variant_ids'],
    noDataTemplateSubString: _t("Sorry, We couldn't find any products under this category"),

    read_events: _.extend({
        'click .d_category_lable': '_onCategoryTabClick',
    }, ProductRootWidget.prototype.read_events),

    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/cards.xml', '/bean_theme/static/src/xml/frontend/utils.xml', '/bean_theme/static/src/xml/frontend/category_filters.xml']),

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Activate clicked category
     * @param {Integer} categoryID
     * @private
     */
    _activateCategory: function (categoryID) {
        this.$('.d_s_category_cards_item').addClass('d-none');
        this.$('.d_s_category_cards_item[data-category-id=' + categoryID + ']').removeClass('d-none');
    },
    /**
    * @private
    * @returns {Integer} categoryID
    */
    _fetchProductsByCategory: function (categoryID) {
        let { includesChild, order, limit } = this.uiConfigInfo;
        var operator = '=';
        if (includesChild) {
            operator = 'child_of';
        }
        return this._rpc({
            route: '/bean_theme/get_products_by_category',
            params: {
                domain: [['public_categ_ids', operator, categoryID]],
                fields: this.fieldstoFetch,
                options: { order: order, limit: limit }
            },
        });
    },
    /**
     * Fetch and render products for category
     * @private
     * @param {Integer} categoryID
     */
    _fetchAndAppendByCategory: function (categoryID) {
        this._activateCategory(categoryID);
        this._fetchProductsByCategory(categoryID).then(data => {
            this._renderNewProducts(data.products, categoryID);
        });
    },
    /**
     * initialize owlCarousel.
     * @override
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        var categories = this.fetchedCategories;
        // if first categories is archive or moved to another website then activate first category
        if (categories.length && categories[0] !== this.initialCategory) {
            this._fetchAndAppendByCategory(categories[0]);
        }
        if (this.uiConfigInfo.mode === 'slider') {
            this.initializeOwlSlider(this.uiConfigInfo.ppr);
        }
    },
    /**
     * @override
     */
    _processData: function (data) {
        var categories = this.fetchedCategories;
        if (!categories.length) {
            this._appendNoDataTemplate();
            return [];
        }

        // if initialCategory is archive or moved to another website
        if (categories.length && categories[0] !== this.initialCategory) {
            return [];
        } else {
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
            return data.products;
        }
    },
    /**
     * Render and append new products.
     * @private
     * @param {Array} products`
     * @param {Integer} categoryID`
     */
    _renderNewProducts: function (products, categoryID) {
        this._markUpValues(this.tpFieldsToMarkUp, products);
        var $tmpl = $(qweb.render('d_s_category_cards_item', {
            data: products,
            widget: this,
            categoryID: categoryID
        }));
        this.$('.d_loader_default').remove();
        $tmpl.appendTo(this.$('.d_s_category_cards_container'));
        this.initializeOwlSlider(this.uiConfigInfo.ppr);
        // this.trigger_up('widgets_start_request', {$target: this.$('.tp_show_similar_products')});
    },
    /**
     * @override
     */
    _setDBData: function (data) {
        var categories = _.map(this.selectionInfo.recordsIDs, function (categoryID) {
            return _.findWhere(data.categories, {id: categoryID});
        });
        this.categories = _.compact(categories);
        this.fetchedCategories = _.map(this.categories, function (category) {
            return category.id;
        });
        this.selectionInfo.recordsIDs = this.fetchedCategories;
        this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onCategoryTabClick: function (ev) {
        var $target = $(ev.currentTarget);
        this.$('.d_category_lable').removeClass('d_active');
        $target.addClass('d_active');
        var categoryID = parseInt($target.attr('data-category-id'), 10);
        if (!this.$('.d_s_category_cards_item[data-category-id=' + categoryID + ']').length) {
            if (this.loaderTemplate) {
                var $template = $(qweb.render(this.loaderTemplate));
                $template.addClass('d_loader_default').appendTo(this.$('.d_s_category_cards_container'));
            }
            this._fetchAndAppendByCategory(categoryID);
        } else {
            this._activateCategory(categoryID);
        }
    },
});

publicWidget.registry.s_single_category_snippet = ProductRootWidget.extend(CategoryPublicWidgetMixins, MarkupRecords, {
    selector: '.s_d_single_category_snippet_wrapper',
    bodyTemplate: 's_single_category_snippet',
    bodySelector: '.s_d_single_category_snippet',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    controllerRoute: '/bean_theme/get_products_by_category',
    fieldstoFetch: ['name', 'price', 'rating', 'public_categ_ids'],
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/dynamic_snippets.xml', '/bean_theme/static/src/xml/frontend/utils.xml']),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),
    /**
     * @private
     */
    _setDBData: function (data) {
        var categories = data.categories;
        if (categories && categories.length) {
            this.categoryName = categories.length ? categories[0].name : false;
        }
        this._super.apply(this, arguments);
    },
    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.initializeOwlSlider(this.uiConfigInfo.ppr);
    },
    /**
     * @private
     */
    _processData: function (data) {
        if (this.categoryName) {
            // group of 8 products
            var items = 8;
            if (config.device.isMobile || config.device.size_class === 3) {
                items = 4;
            }
            this._markUpValues(this.tpFieldsToMarkUp, data.products);
            var group = _.groupBy(data.products, function (product, index) {
                return Math.floor(index / (items));
            });
            return _.toArray(group);
        } else {
            return [];
        }
    },
    initializeOwlSlider: function () {
        this.$('.BeanBakery_product_category_slider').owlCarousel({ dots: false, margin: 10, stagePadding: 5, rtl: _t.database.parameters.direction === 'rtl', rewind: true, nav: true, navText: ['<div class="badge text-primary"><i class="dri font-weight-bold dri-chevron-left-l"></i></div>', '<div class="badge text-primary"><i class="dri dri-chevron-right-l font-weight-bold"></i></div>'], responsive: {0: {items: 1}, 576: {items: 1}, 768: {items: 1}, 992: {items: 1}, 1200: {items: 1}}});
    }
});

// Full product snippet
publicWidget.registry.s_single_product_snippet = RootWidget.extend(ProductCarouselMixins, {
    selector: '.s_d_single_product_snippet_wrapper',

    snippetNodeAttrs: (RootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    bodyTemplate: 's_single_product_snippet',
    controllerRoute: '/bean_theme/get_quick_view_html',
    bodySelector: '.d_single_product_continer',
    noDataTemplateString: _t("No product found"),
    noDataTemplateSubString: _t("Sorry, this product is not available right now"),
    displayAllProductsBtn: false,

    xmlDependencies: (RootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/dynamic_snippets.xml']),

    _setCamelizeAttrs: function () {
        this._super.apply(this, arguments);
        if (this.selectionInfo) {
            var productIDs = this.selectionInfo.recordsIDs;
            // first category
            if (productIDs.length) {
                this.initialProduct = productIDs[0];
            }
        }
    },
    /**
    * @private
    */
    _getOptions: function () {
        var options = {};
        if (this.initialProduct) {
            options['productID'] = this.initialProduct;
            return options;
        } else {
            return this._super.apply(this, arguments);
        }
    },
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.trigger_up('widgets_start_request', {
            $target: this.$('.oe_website_sale'),
        });
        this._bindEvents(this._getBodySelectorElement());
    },
});

// Full product snippet + cover
publicWidget.registry.s_d_single_product_cover_snippet = publicWidget.registry.s_single_product_snippet.extend({
    selector: '.s_d_single_product_cover_snippet_wrapper',

    bodyTemplate: 's_d_single_product_cover_snippet',
    bodySelector: '.s_d_single_product_cover_snippet',

    /**
    * @private
    */
    _getOptions: function () {
        var options = {};
        if (this.initialProduct) {
            options['productID'] = this.initialProduct;
            options['right_panel'] = true;
            return options;
        } else {
            return this._super.apply(this, arguments);
        }
    },
});

publicWidget.registry.s_d_top_categories = RootWidget.extend({
    selector: '.s_d_top_categories',
    bodyTemplate: 's_top_categories_snippet',
    bodySelector: '.s_d_top_categories_container',
    controllerRoute: '/bean_theme/get_top_categories',

    snippetNodeAttrs: (RootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info', 'data-ui-config-info']),

    xmlDependencies: (RootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/dynamic_snippets.xml']),

    noDataTemplateString: _t("No categories found!"),

    noDataTemplateSubString: false,
    displayAllProductsBtn: false,

    /**
    * @private
    */
    _getOptions: function () {
        var options = {};
        if (this.selectionInfo) {
            options['params'] = {
                categoryIDs: this.selectionInfo.recordsIDs,
                sortBy: this.uiConfigInfo.sortBy,
                limit: this.uiConfigInfo.limit,
                includesChild: this.uiConfigInfo.includesChild,
            };
            return options;
        } else {
            return this._super.apply(this, arguments);
        }
    },
    _setDBData: function (data) {
        this._super.apply(this, arguments);
        var FetchedCategories = _.map(data, function (category) {
            return category.id;
        });
        var categoryIDs = [];
        _.each(this.selectionInfo.recordsIDs, function (categoryID) {
            if (_.contains(FetchedCategories, categoryID)) {
                categoryIDs.push(categoryID);
            }
        });
        this.selectionInfo.recordsIDs = categoryIDs;
    },
    /**
    * @private
    */
    _processData: function (data) {
        return _.map(this.selectionInfo.recordsIDs, function (categoryID) {
            return _.findWhere(data, {id: categoryID});
        });
    },
});

publicWidget.registry.s_d_product_count_down = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_d_product_count_down',

    bodyTemplate: 's_d_product_count_down_template',

    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),

    controllerRoute: '/bean_theme/get_products_data',

    fieldstoFetch: ['name', 'price', 'description_sale', 'rating', 'public_categ_ids', 'offer_data'],

    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/2_col_deal.xml']),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),
    /**
     * @private
     */
    _getOptions: function () {
        var options = this._super.apply(this, arguments);
        if (this.selectionType) {
            options = options || {};
            options['shop_config_params'] = true;
        }
        return options;
    },
    /**
     * @private
     */
    _setDBData: function (data) {
        this.shopParams = data.shop_config_params;
        this._super.apply(this, arguments);
    },
    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.trigger_up('widgets_start_request', {
            editableMode: this.editableMode,
            $target: this.$('.tp-countdown'),
        });
        this.$('.BeanBakery_product_slider_top').owlCarousel({
            dots: false,
            margin: 20,
            stagePadding: 5,
            rewind: true,
            rtl: _t.database.parameters.direction === 'rtl',
            nav: true,
            navText: ['<i class="dri h4 dri-chevron-left-l"></i>', '<i class="dri h4 dri-chevron-right-l"></i>'],
            responsive: {0: {items: 1}, 768: {items: 2}, 992: {items: 1}, 1200: {items: 1},
            },
        });
    },
});

publicWidget.registry.s_two_column_card_wrapper = ProductRootWidget.extend(OwlMixin, ProductsBlockMixins, {
    selector: '.s_two_column_card_wrapper',
    bodyTemplate: 'd_s_cards_wrapper',
    bodySelector: '.s_two_column_cards',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info', 'data-ui-config-info']),
    controllerRoute: '/bean_theme/get_products_data',
    fieldstoFetch: ['name', 'price', 'dr_label_id', 'rating', 'public_categ_ids', 'product_variant_ids', 'description_sale'],
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/cards.xml', '/bean_theme/static/src/xml/frontend/utils.xml']),

    _setCamelizeAttrs: function () {
        this._super.apply(this, arguments);
        if (this.uiConfigInfo) {
            this.uiConfigInfo['ppr'] = 2;
        }
        this.selectionType = false;
        if (this.selectionInfo) {
            this.selectionType = this.selectionInfo.selectionType;
        }
    },
    /**
     * initialize owlCarousel.
     * @private
     */
        _modifyElementsAfterAppend: function () {
            this._super.apply(this, arguments);
            if (this.uiConfigInfo.mode === 'slider') {
                this.initializeOwlSlider(this.uiConfigInfo.ppr);
            }
        },
});
publicWidget.registry.s_d_product_small_block = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_d_product_small_block',

    bodyTemplate: 's_d_product_small_block_template',

    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),

    controllerRoute: '/bean_theme/get_products_data',

    fieldstoFetch: ['name', 'price', 'rating', 'public_categ_ids'],

    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/2_col_deal.xml']),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),

    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        var self = this;
        this._super.apply(this, arguments);
        this.inConfirmDialog = this.$el.hasClass('in_confirm_dialog');
        var numOfCol = this.inConfirmDialog ? 4 : 3;
        if (this.inConfirmDialog) {
            this.$('.owl-carousel').removeClass('container');
        }
        this.$('.BeanBakery_product_slider_top').owlCarousel({ dots: false, margin: 20, stagePadding: this.inConfirmDialog ? 0 : 5, rewind: true, nav: true, rtl: _t.database.parameters.direction === 'rtl', navText: ['<i class="dri h4 dri-chevron-left-l"></i>', '<i class="dri h4 dri-chevron-right-l"></i>'],
            onInitialized: function () {
                var $img = self.$('.d-product-img:first');
                if (self.$('.d-product-img:first').length) {
                    $img.one("load", function () {
                        setTimeout(function () {
                            if (!config.device.isMobile) {
                                var height = self.$target.parents('.s_d_2_column_snippet').find('.s_d_product_count_down .owl-item.active .tp-side-card').height();
                                self.$('.owl-item').height(height+1);
                            }
                        }, 300);
                    });
                }
            },
            responsive: {0: {items: 2}, 576: {items: 2}, 768: {items: 2}, 992: {items: 2}, 1200: {items: numOfCol}
            },
        });
    },
});

publicWidget.registry.s_d_image_products_block = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_d_image_products_block_wrapper',
    bodyTemplate: 's_d_image_products_block_tmpl',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    bodySelector: '.s_d_image_products_block',
    controllerRoute: '/bean_theme/get_products_data',
    fieldstoFetch: ['name', 'price', 'rating', 'public_categ_ids'],
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/s_image_products.xml']),
    jsLibs: (ProductRootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),

    _processData: function (data) {
        var products = this._getProducts(data);
        var items = 6;
        if (config.device.isMobile) {
            items = 4;
        }
        var group = _.groupBy(products, function (product, index) {
            return Math.floor(index / (items));
        });
        return _.toArray(group);
    },
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.$('.BeanBakery_product_slider_top').owlCarousel({ dots: false, margin: 10, stagePadding: 5, rewind: true, nav: true, rtl: _t.database.parameters.direction === 'rtl', navText: ['<i class="dri h4 dri-chevron-left-l"></i>', '<i class="dri h4 dri-chevron-right-l"></i>'], responsive: {0: {items: 1}, 576: {items: 1}, 768: {items: 1}, 992: {items: 1}, 1200: {items: 1}},
        });
    },
});

publicWidget.registry.s_d_products_grid_wrapper = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_d_products_grid_wrapper',
    bodyTemplate: 's_d_products_grid_tmpl',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    bodySelector: '.s_d_products_grids',
    controllerRoute: '/bean_theme/get_products_data',
    fieldstoFetch: ['name', 'price', 'rating', 'public_categ_ids', 'offer_data'],
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/s_product_grid.xml', '/bean_theme/static/src/xml/frontend/utils.xml', '/bean_theme/static/src/xml/cards.xml']),
    _getOptions: function () {
        if (!this.selectionInfo) {
            return false;
        }
        return this._super.apply(this, arguments);
    },
    /**
     * initialize owlCarousel.
     * @private
     */
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        this.trigger_up('widgets_start_request', {
            editableMode: this.editableMode,
            $target: this.$('.tp-countdown')
        });
    }
});
// Mega menus
publicWidget.registry.s_tp_mega_menu_category_snippet = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_tp_mega_menu_category_snippet',
    bodySelector: '.s_tp_mega_menu_category_snippet_wrapper',
    bodyTemplate: 's_tp_hierarchical_category_wrapper',
    controllerRoute: '/bean_theme/get_megamenu_categories',
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/hierarchical_category_templates.xml']),
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info', 'data-ui-config-info']),

    _getOptions: function () {
        if (this.selectionInfo && this.selectionInfo.recordsIDs) {
            return { categoryIDs: this.selectionInfo.recordsIDs};
        }
        return false;
    },
    destroy: function () {
        if (this.selectionInfo && this.uiConfigInfo) {
            this._super.apply(this, arguments);
        }
    },
    _getLimit: function () {
        return this.uiConfigInfo.limit || false;
    },
    _processData: function (data) {
        let result = [];
        _.each(this.selectionInfo.recordsIDs, recordsID => {
            let categoryRec = _.find(data, function (category) { return category.category.id === recordsID; });
            if (categoryRec) {
                result.push(categoryRec);
            }
        });
        return result;
    },
});
publicWidget.registry.s_category_ui_snippet = ProductRootWidget.extend(ProductsBlockMixins, {
    selector: '.s_category_snippet_wrapper',
    bodySelector: '.s_category_snippet',
    snippetNodeAttrs: (ProductRootWidget.prototype.snippetNodeAttrs || []).concat(['data-selection-info']),
    bodyTemplate: 's_tp_category_wrapper_template',
    controllerRoute: '/bean_theme/get_categories_info',
    xmlDependencies: (ProductRootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/s_category.xml']),
    fieldstoFetch: ['dr_category_label_id'],
    _setCamelizeAttrs: function () {
        this._super.apply(this, arguments);
        if (this.selectionInfo) {
            this.categoriesTofetch = [];
            this.categoriesTofetch = this.selectionInfo.recordsIDs;
            this.categoryStyle = this.uiConfigInfo.style;
        }
    },
    _getOptions: function () {
        return {categoryIDs: this.categoriesTofetch, getCount: true};
    },
    _processData: function (data) {
        let categories = _.map(this.categoriesTofetch, function (categoryID) {
            return _.findWhere(data, {id: categoryID});
        });
        return _.compact(categories);
    },
});

publicWidget.registry.s_d_brand_snippet = RootWidget.extend({
    selector: '.s_d_brand_snippet_wrapper',

    controllerRoute: '/bean_theme/get_brands',
    bodyTemplate: 's_d_brand_snippet',
    bodySelector: '.s_d_brand_snippet',
    fieldstoFetch: ['id', 'name', 'attribute_id'],
    displayAllProductsBtn: false,
    noDataTemplateString: _t("No brands are found!"),
    noDataTemplateSubString: _t("Sorry, We couldn't find any brands right now"),
    xmlDependencies: (RootWidget.prototype.xmlDependencies || []).concat(['/bean_theme/static/src/xml/frontend/brands.xml']),
    jsLibs: (RootWidget.prototype.jsLibs || []).concat(['/bean_theme/static/lib/OwlCarousel2-2.3.4/owl.carousel.js']),

    /**
     * @private
     */
    _getOptions: function () {
        this.brandCount = parseInt(this.$target.get(0).dataset.brandCount);
        this.mode = this.$target.get(0).dataset.mode;
        this.cardStyle = this.$target.get(0).dataset.cardStyle || 'tp_brand_card_style_1';
        return {
            'limit': this.brandCount,
        };
    },
    _modifyElementsAfterAppend: function () {
        this._super.apply(this, arguments);
        if (this.mode === 'slider') {
            this.$('.s_d_brand_snippet > .row').addClass('owl-carousel');
            this.$('.s_d_brand_snippet > .row > *').removeAttr('class').addClass(this.cardStyle);
            // remove col-* classes
            this.$('.s_d_brand_snippet > .row > *').removeAttr('class');
            this.$('.s_d_brand_snippet > .row').removeClass('row');
            this.$('.owl-carousel').owlCarousel({nav: false, autoplay: true, autoplayTimeout: 4000, responsive: {0: {items: 2}, 576: {items: 4}}});
        }
    },
});

publicWidget.registry.tp_image_hotspot = publicWidget.Widget.extend(HotspotMixns, cartMixin, {
    // V15 refector whole widget such a way that we can pass params directly in Qweb
    // <t t-if="productInfo"> is bad code

    selector: '.tp_hotspot',
    xmlDependencies: ['/bean_theme/static/src/xml/frontend/image_hotspot.xml'],
    disabledInEditableMode: false,
    /**
     * @override
     */
    willStart: function () {
        const _super = this._super.bind(this, ...arguments);
        this.hotspotType = this.$el.get(0).dataset.hotspotType;
        this.onHotspotClick = this.$el.get(0).dataset.onHotspotClick;
        if (this._isPublicUser()) {
            return this._isLoaded().then(() => {
                return this._getHotspotResolver(_super);
            });
        } else {
            return this._getHotspotResolver(_super);
        }
    },
    /**
     * @override
     */
    start: function () {
        if (!this.editableMode && !(this.hotspotType === 'dynamic' && this.onHotspotClick === 'modal')) {
            this.$target.attr('tabindex', '0');
            this.$target.attr('data-toggle', 'popover');
            this.$target.attr('data-trigger', 'focus');
            this._initPopover();
        } else {
            this.$target.removeAttr('tabindex');
            this.$target.removeAttr('data-toggle');
            this.$target.removeAttr('data-trigger');
        }
        if (!this.editableMode) {
            this._cleanNodeAttr();
        }
        return this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Get resolver based on hotspot type
     *
     * @private
     *
     */
    _getHotspotResolver: function (_super) {
        return this.hotspotType === 'dynamic' ? Promise.all([this._fetchData(), _super()]) : _super();
    },
    /**
     * This is responsible to fetch product related data.
     *
     * @returns {Promise}
     */
    _fetchData: function () {
        return this._rpc({
            'route': '/bean_theme/get_products_data',
            'params': {
                'domain': [['id', 'in', [parseInt(this.$target.get(0).dataset.productId)]]],
                'fields': ['description_sale', 'rating'],
                'limit': 1
            },
        }).then((data) => {
            this.productInfo = data.products.length ? data.products[0] : false;
            if (this.productInfo && this.productInfo.has_discounted_price) {
                this.productInfo['discount'] = Math.round((this.productInfo.list_price_raw - this.productInfo.price_raw) / this.productInfo.list_price_raw * 100);
            }
        });
    },
    /**
     * initialize popover
     */
    _initPopover: function (ev) {
        var self = this;
        this.$target.popover({animation: true, container: 'body', html: true, placement: 'auto', content: qweb.render('bean_theme.tp_img_static_template', {widget: this, data: this._getHotspotConfig()}),
        }).on('shown.bs.popover', function () {
            var $popover = $($(this).data("bs.popover").tip);
            $popover.off().on('click', '.tp-add-to-cart-action', ev => {
                self.onAddToCartClick(ev, QuickViewDialog);
            });
            $popover.addClass('tp-popover-element border-0 shadow-sm');
        });
    },
    /**
     * That's good code. isn't it? :)
     */
    _isLoaded: function () {
        let def = new Promise((resolve, reject) => {
            var $relatedImage = $(this.$target.closest('.tp-img-hotspot-wrapper').find(".tp-img-hotspot-enable"));
            if ($relatedImage.height() > 0) {
                resolve();
            }
            $relatedImage.one("load", function () { resolve(); });
        });
        return def;
    },
});

sAnimations.registry.TpHotspotScroll = sAnimations.Animation.extend({
    selector: '.tp_hotspot',
    effects: [{
        startEvents: 'scroll',
        update: '_onScroll',
    }],
    _onScroll: function (scroll) {
        if ($('.tp-popover-element:visible').length) {
            this.$target.blur();
        }
    },
});

});
