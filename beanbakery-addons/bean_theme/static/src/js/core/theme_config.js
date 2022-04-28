/** @odoo-module **/

import CustomizeMenu from 'website.customizeMenu';
import Dialog from 'web.Dialog';
import Widget from 'web.Widget';
import { _t, qweb }  from 'web.core';
import { WebsiteNavbarActionWidget } from 'website.navbar';
import { registry } from '@web/core/registry';

var AbstractThemeOption = Widget.extend({
    events: { change: '_onWidgetValueChange' },
    key: false,
    option_template: false,
    init: function (parent, options) {
        this.options = _.defaults(options || {}, {source: false, imageURL: false, label: 'Label', _classes: ''});
        this.label = this.options.label;
        this.source = this.options.source || odoo.dr_theme_config;
        if (!this.key) {
            this.key = this.options.key;
        }
        this.tooltip = this.options.tooltip;
        this._classes = this.options._classes;
        this.selection = this.options.selection;
        this.value = this.source[this.key];
        this.dirty = false;
        this._super.apply(this, arguments);
    },
    start: function () {
        return this._super.apply(this, arguments).then(() => {
            return this._render();
        });
    },

    /**
     * This method will be called from outside to.
     */
    getExportValue: function () {
        return this.value;
    },

    /**
     * This method is used to set internal state and render widget again.
     */
    setValue: function (value) {
        this.value = value;
        this.dirty = true;
        this._render();
    },
    getValue: function () {
        return this.value;
    },

    _render: function (value) {
        var $option = qweb.render(this.option_template, {value: this.value, image: this.getImageURL, widget: this});
        this.$el.children().remove();
        return this.$el.append($option);
    },

    getImageURL: function () {
        return this.imageURL;
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onWidgetValueChange: function () {},
});

var ThemeOptionTitle = AbstractThemeOption.extend({
    option_template: 'theme_config.Title',
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.title = options.title;
        this.subtitle = options.subtitle;
    }
});

var ThemeOptionRadio = AbstractThemeOption.extend({
    option_template: 'theme_config.Radio',
    _onWidgetValueChange: function (ev) {
        this.setValue(this.$(`input[name='${this.key}']:checked`).val());
    }
});

var ThemeOptionCheckbox = AbstractThemeOption.extend({
    option_template: 'theme_config.Checkbox',
    _onWidgetValueChange: function (ev) {
        this.setValue(this.$(`#${this.key}`).prop('checked'));
    }
});

var ThemeOptionSelection = AbstractThemeOption.extend({
    option_template: 'theme_config.Selection',
    _onWidgetValueChange: function (ev) {
        this.setValue(this.$(`#${this.key}`).val());
    }
});

var ThemeOptionNumber = ThemeOptionSelection.extend({
    option_template: 'theme_config.Number',
    _onWidgetValueChange: function (ev) {
        this.setValue(parseInt(this.$(`#${this.key}`).val()));
    }
});


var ThemeOptionJson = AbstractThemeOption.extend({
    option_template: 'theme_config.json',

    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.allWidgets = [];
        this.widgets = options.widgets;
        this.visibilityKey = options.visibilityKey || false;
    },

    start: function () {
        return this._super.apply(this, arguments).then(() => {
            return this.renderSubWidgets();
        });
    },
    renderSubWidgets: function () {
        var widgetObjs = _.map(this.widgets, wid => {
            var options = wid.options || {};
            options.source = this.value;
            if (typeof wid === 'object') {
                return new wid.widgetRef(this, wid.options);
            } else {
                return new wid(this, options);
            }
        });
        this.allWidgets.push(...widgetObjs);
        var promises = _.map(widgetObjs, obj => obj.appendTo(this.$el));
        return Promise.all(promises).then(() => { this._processVisibility() });
    },
    _onWidgetValueChange: function (ev) {
        this.dirty = true;
        this._processVisibility();
    },
    _processVisibility: function () {
        if (this.visibilityKey) {
            setTimeout(() => {
                var visibilityOption = _.find(this.allWidgets, (wid) => { return wid.key == this.visibilityKey; });
                _.each(this.allWidgets, (wid) => {
                    wid.$el.toggleClass('d-none', !visibilityOption.value);
                });
                visibilityOption.$el.removeClass('d-none');
            }, 0);
        }
    },
    getValue: function () {
        var result = {}
        _.each(this.allWidgets, function (wid) {
            result[wid.key] = wid.getValue();
        });
        return result;
    }
});

var ThemeOptionBottomBar = AbstractThemeOption.extend({
    option_template: 'theme_config.BottomBar',
    key: 'actions',
    willStart: function () {
        return Promise.all([this._fetchData(), this._super.apply(this, arguments)]);
    },
    _fetchData: async function () {
        this.actions = await this._rpc({ model: 'website', method: 'get_bean_theme_bottom_bar_action_buttons'});
    },
    _render: function () {
        this._super.apply(this, arguments);
        this.$actions = this.$('.tp-select2-actions-input');
        this.$actions.select2({maximumSelectionSize: 8});
    },
    _onWidgetValueChange: function () {
        this.setValue(this.$actions.val());
    }
});

var ThemeConfigDialog = Dialog.extend({
    template: 'bean_theme.theme_configurator_dialog',
    xmlDependencies: Dialog.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/core/theme_config.xml']),
    events: _.extend({}, Dialog.prototype.events || {}, {
        'click .tp-save-btn': '_onSaveDialog',
        'click .tp-close-btn': 'close',
    }),
    init: function (parent, options) {
        this.tabs = this._tabInfo();
        this.allWidgets = [];
        return this._super(parent, _.extend(options || {}, {
            title: options.title,
            size: options.size || 'extra-large',
            technical: false,
            dialogClass: 'd-snippet-config-dialog p-0'
        }));
    },

    start: function () {
        // Resolve conflict with configurator dialog
        this.$el.css('height', '100%');
        this.$('.dr-config-right').addClass('p-4');
        return this._super.apply(this, arguments).then(() => {
            return this.fillTabs();
        });
    },

    _tabInfo: function () {
        return [{
            name: 'GeneralConfig',
            icon: 'fa fa-sliders',
            label: _t('General'),
            widgets: [
                { options: { title: _t('Cart Flow'), subtitle: _t('You can change how products are being added in cart.')}, widgetRef: ThemeOptionTitle},
                { options: { key: 'cart_flow', selection: [['default', 'Default'], ['notification', 'Notification'], ['dialog', 'Dialog'], ['side_cart', 'Open Cart Sidebar']],}, widgetRef: ThemeOptionRadio},
                { options: { title: _t('Brand Page'), _classes: 'mt-4'}, widgetRef: ThemeOptionTitle},
                { options: { key: 'json_brands_page', widgets: [
                    { options: { key: 'disable_brands_grouping', label: _t('Disable grouping of brands')}, widgetRef: ThemeOptionCheckbox }
                ]}, widgetRef: ThemeOptionJson,},
                { options: { title: _t('Language/Pricelist Selector'), _classes: 'mt-4'}, widgetRef: ThemeOptionTitle},
                { options: { key: 'json_general_language_pricelist_selector', widgets: [
                    { options: { key: 'hide_country_flag', label: _t('Hide country flag')}, widgetRef: ThemeOptionCheckbox }
                ]}, widgetRef: ThemeOptionJson}
            ]
        }, {
            name: 'ShopConfig',
            icon: 'fa fa-shopping-cart',
            label: _t('Shop'),
            widgets: [
                { options: { title: _t('Product Card Options'), subtitle: _t('Below items will display on product card in shop grid.') }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_grid_product', widgets: [
                    { options: { key: 'show_color_preview', label: _t('Show color preview')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_quick_view', label: _t('Show quick view')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_similar_products', label: _t('Show similar products')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_rating', label: _t('Show rating'), tooltip: _("To show rating, You have to activate 'Discussion and Rating' option in product detail page too.")}, widgetRef: ThemeOptionCheckbox },
                ]}, widgetRef: ThemeOptionJson},
                { options: { title: _t('Shop Filter'), subtitle: _t('Tweak filters behavior on shop.'), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_shop_filters', widgets: [
                    { options: { key: 'filter_method', label: _t('Apply filter method'), selection: [['default', 'Default (Reload page)'], ['lazy', 'Lazy']]}, widgetRef: ThemeOptionSelection },
                    { options: { key: 'in_sidebar', label: _t('Show filters in sidebar')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'collapsible', label: _t('Collapsible filters')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_category_count', label: _t('Show category count')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_attrib_count', label: _t('Show attribute count') }, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'hide_extra_attrib_value', label: _t('Hide extra attributes'), tooltip: _("Hide attribute value if it is not matched with any product") }, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_rating_filter', label: _t('Show rating filter')}, tooltip: _("To show rating, You have to activate 'Discussion and Rating' option in product detail page too."), widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'tags_style', label: _t('Tags style'), selection: [['1', 'List'], ['2', 'Pill']]}, widgetRef: ThemeOptionSelection },
                ]}, widgetRef: ThemeOptionJson},
                { options: { title: _t('Category Pills'), subtitle: _t('Show product categories pills on top of the shop page.'), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_category_pills', widgets: [
                    { options: { key: 'enable', label: _t('Enable category pills')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'enable_child', label: _t('Show child categories pills'), tooltip: _t('Show child categories pills of active category.')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'hide_desktop', label: _t('Hide in desktop device')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_title', label: _t('Show title Categories')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'style', label: _t('Style'), selection: [['1', 'Card'], ['2', 'Text'], ['3', 'Thumbnail + Text (Circle)'], ['4', 'Thumbnail + Text (Rounded)']]}, widgetRef: ThemeOptionSelection },
                ], visibilityKey: 'enable'}, widgetRef: ThemeOptionJson},
                { options: { title: _t('Search'), subtitle: _t('Tweak search behavior for your website.'), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_product_search', widgets: [
                    { options: { key: 'advance_search', label: _t('Enable advance search')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'search_category', label: _t('Categories')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'search_attribute', label: _t('Smart Autocomplete')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'search_suggestion', label: _t('Smart Suggestion')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'search_fuzzy', label: _t('Fuzzy search')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'search_max_product', label: _t('Products limit'), tooltip: _("Max 5")}, widgetRef: ThemeOptionNumber },
                    { options: { key: 'search_limit', label: _t('Result Limit'), tooltip: _("Min 5 and Max 10")}, widgetRef: ThemeOptionNumber },
                ], visibilityKey: 'advance_search'}, widgetRef: ThemeOptionJson},
                { options: { title: _t('Lazy Load Products'), subtitle: _t('Enable lazy load products on shop page.'), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                {options: {
                        key: 'json_lazy_load_config', widgets: [
                            { options: { key: 'enable_ajax_load_products', label: _t('Enable lazy load products') }, widgetRef: ThemeOptionCheckbox },
                            { options: { key: 'enable_ajax_load_products_on_click', label: _t('Lazy load product on click') }, widgetRef: ThemeOptionCheckbox },
                        ], visibilityKey: 'enable_ajax_load_products'
                    }, widgetRef: ThemeOptionJson
                },
            ]
        }, {
            name: 'ProductDetailConfig',
            icon: 'fa fa-cube',
            label: _t('Product Detail'),
            widgets: [
                { options: { title: _t('Product Zoom'), subtitle: _t('Configuration for the zoom. used in product detail page and quick view.'), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_zoom', widgets: [
                    { options: { key: 'zoom_enabled', label: _t('Enable zoom')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'zoom_factor', label: _t('Zoom factor')}, widgetRef: ThemeOptionNumber },
                    { options: { key: 'disable_small', label: _t('Hide in desktop device'), tooltip: _t("Image smaller the 1024x1024 won't be zoomed if this option is enabled.")}, widgetRef: ThemeOptionCheckbox },
                ], visibilityKey: 'zoom_enabled'}, widgetRef: ThemeOptionJson},
                { options: { title: _t('Sticky Add to Cart'), subtitle: _t("Allows users to follow up product's Add to Cart button until bottom scroll reached."), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'bool_sticky_add_to_cart', 'label': _t('Enable sticky add to cart') }, widgetRef: ThemeOptionCheckbox},
                { options: { title: _t('Product Offers'), subtitle: _t("You will be able to add offers on product and show details in dialog."), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'bool_product_offers', 'label': _t('Enable product offers') }, widgetRef: ThemeOptionCheckbox},
            ]
        }, {
            name: 'MobileConfig',
            icon: 'fa fa-mobile',
            label: _t('Mobile'),
            widgets: [
                { options: { title: _t('Bottombar'), subtitle: _t("Bottom bar allow movement between primary destinations on the website."), _classes: 'mt-4' }, widgetRef: ThemeOptionTitle },
                { options: { key: 'json_bottom_bar', widgets: [
                    { options: { key: 'show_bottom_bar', label: _t('Show Bottombar')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'show_bottom_bar_on_scroll', label: _t('Show Bottombar On Scroll')}, widgetRef: ThemeOptionCheckbox },
                    { options: { key: 'filters', label: _t('Show sort and filter button on shop')}, widgetRef: ThemeOptionCheckbox },
                    ThemeOptionBottomBar
                ], visibilityKey: 'show_bottom_bar'}, widgetRef: ThemeOptionJson},
            ]
        }];
    },

    fillTabs: function () {
        return _.map(this.tabs, tab => {
            var widgetObjs = _.map(tab.widgets, wid => {
                if (typeof wid === 'object') {
                    return new wid.widgetRef(this, wid.options);
                } else {
                    return new wid(this);
                }
            });
            this.allWidgets.push(...widgetObjs);
            var promises = _.map(widgetObjs, obj => obj.appendTo(this.$('#' + tab.name)));
            return Promise.all(promises);
        });
    },

    _onSaveDialog: function () {
        var payload = {};
        _.each(this.allWidgets, wid => {
            if (wid.dirty) {
                payload[wid.key] = wid.getValue();
            }
        });
        return this._rpc({
            route: '/bean_theme/save_website_config',
            params: {
                configs: payload,
            }
        }).then(() => window.location.reload());
    }
});


var BeanThemeConfig = WebsiteNavbarActionWidget.extend({
    actions: _.extend({}, WebsiteNavbarActionWidget.prototype.actions || {}, {
        'open-theme-prime-config-dialog': '_openThemeConfigDialog',
    }),
    _openThemeConfigDialog: function () {
        new ThemeConfigDialog(this, {renderFooter: false, renderHeader: false, title: _t('Configurations')}).open();
    },
});

registry.category('website_navbar_widgets').add('BeanThemeConfigMenu', {
    Widget: BeanThemeConfig,
    selector: '#tp_bean_config',
});

export default {
    AbstractThemeOption, ThemeOptionTitle, ThemeOptionRadio, ThemeOptionCheckbox, ThemeOptionSelection, ThemeOptionNumber,
    ThemeOptionJson, ThemeOptionBottomBar, ThemeConfigDialog, BeanThemeConfig
};
