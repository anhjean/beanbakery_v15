/** @odoo-module alias=bean_theme.domain_builder */
import AbstractComponent from '@bean_theme/js/editor/components/abstract_component';
import { registry } from '@web/core/registry';
import { qweb, _t } from 'web.core';
import Widget from 'web.Widget';
import utils from 'web.utils';

var Dialog = require('web_editor.widget').Dialog;

var DomainBuilder = AbstractComponent.extend({
    template: 'drg_domain_builder',
    xmlDependencies: ["/bean_theme/static/src/xml/editor/components/domain_component.xml"],
    events: {
        'click .drg_add_rule': 'onClickAddRule',
        'click .db_condition': 'onClickCondition',
        'click .db_view_products': 'onClickViewProducts',
        'click .dr-choose-template': 'onClickChooseTemplate',
        'change #d_domain_limit_input': '_onChangeLimit',
    },
    custom_events: _.extend({}, AbstractComponent.prototype.custom_events || {}, { 'remove_rule': 'onRemoveRule' }),
    init: function (parent, options) {
        this.domain = options.domain || [];
        this.limit = options.limit || 5;
        this.sortByDetails = { 'list_price asc': _t("Price: Low to High"), 'list_price desc': _t("Price: High to Low"), 'name asc': _t("Name: A to Z"), 'name desc': _t("Name: Z to A"), 'create_date desc': _t("Newly Arrived"), 'bestseller': _t("Bestseller") };
        this.sortBy = this.sortBy || 'price_desc';
        this.ruleWidgets = [];
        this._super.apply(this, arguments);
    },
    start: function () {
        this._initDomainNodes();
        this.$('.dr_templates_container .dr-template-help').popover({ title: "Note", content: "Here are some pre defined rule templates to help you quick start. You can select any template and then modify it further according to your need", delay: 0, html: true, trigger: 'hover' });
        return this._super.apply(this, arguments);
    },
    ComponentCurrentState: function () {
        var condition = this.$('.db_condition_btn').data('condition');
        var symbol = condition == 'all' ? '&' : '|';
        var domain = _.range(this.ruleWidgets.length - 1).map(function () { return symbol; });
        _.each(this.ruleWidgets, domainRow => domain.push(domainRow.getValue()));
        return {
            domain: domain,
            limit: parseInt(this.$('#d_domain_limit_input').val(), 10),
            order: this.$('#d_domain_sort_by_input').val()
        };
    },
    _initDomainNodes: function () {
        if (this.domain.length === 0) {
            return;
        }
        if (this.domain[0] === '|') {
            this.$('.db_condition_btn').text(_('Any')).data('condition', 'any');
        }
        _.each(this.domain, (node) => {
            if (node !== "|" && node !== "&") {
                this.onClickAddRule(false, node);
            }
        });
    },
    onClickAddRule: function (ev, value) {
        if (ev) {
            ev.preventDefault();
        }
        var rule = new DomainBuilderRow(this, value);
        this.ruleWidgets.push(rule);
        rule.appendTo(this.$('.drg_rule_container'));
    },
    onClickCondition: function (ev) {
        ev.preventDefault();
        if ($(ev.currentTarget).data('condition') === 'all') {
            this.$('.db_condition_btn').text(_('All')).data('condition', 'all');
        } else {
            this.$('.db_condition_btn').text(_('Any')).data('condition', 'any');
        }
    },
    onClickViewProducts: function () {
        var domainInfo = this.ComponentCurrentState();
        return this._rpc({
            route: '/bean_theme/tp_search_read',
            params: { ...domainInfo, fields: ['name', 'id'], model: 'product.template' },
        }).then(result => {
            var d = new Dialog(this, {
                title: _t('Selected Products'),
                buttons: [{ text: _t('Ok'), classes: 'btn-primary', close: true }],
                $content: qweb.render('drg_domain_builder_products', { products: result }),
            });
            d.open();
            d._opened.then(function () {
                d.$modal.toggleClass('o_technical_modal BeanBakery_technical_modal');
            });
        });
    },
    _onChangeLimit: function (ev) {
        var val = $(ev.currentTarget).val();
        this.$(ev.currentTarget).val(utils.confine(val.replace(/\D/g, ''), 1, 20));
    },
    onRemoveRule: function (ev) {
        var ruleId = ev.data.ruleId;
        this.ruleWidgets = _.filter(this.ruleWidgets, function (w) {
            if (w.ruleId === ruleId) {
                w.destroy();
                return false;
            }
            return true;
        });
    },
    getDomainTemplates: function () {
        return [
            { name: _t("New Arrival"), icon: 'fa fa-cube bg-primary-light text-primary', desc: _t("This show the newly arrived products based on creation date."), domain: [], sortBy: 'create_date desc' },
            { name: _t("Category New Arrival"), icon: 'dri dri-category bg-primary-light text-primary', desc: _t("This will show the newly arrived products from selected categories."), domain: [["public_categ_ids", "in", []]], sortBy: 'create_date desc' },
            { name: _t("Brand New Arrival"), icon: 'fa fa-slack bg-primary-light text-primary', desc: _t("This will show the newly arrived products from selected brands."), domain: [["dr_brand_value_id", "in", []]], sortBy: 'create_date desc' },
            { name: _t("Tags New Arrival"), icon: 'dri dri-tag-l bg-primary-light text-primary', desc: _t("This will show the newly arrived products from selected tags."), domain: [["dr_tag_ids", "in", []]], sortBy: 'create_date desc' },
            { name: _t("Label New Arrival"), icon: 'fa fa-bookmark-o bg-primary-light text-primary', desc: _t("This will show the newly arrived products from selected label."), domain: [["dr_label_id", "in", []]], sortBy: 'create_date desc' },
            { name: _t("Discounted Products"), icon: 'fa fa-cube bg-success-light text-success', desc: _t("This will show discounted products based on product pricelist."), domain: [['dr_has_discount', '!=', false]], sortBy: 'list_price asc' },
            { name: _t("Category Discounted Products"), icon: 'dri dri-category bg-success-light text-success', desc: _t("This will show discounted products based on product pricelist from selected categories."), domain: ['&', ['dr_has_discount', '!=', false], ["public_categ_ids", "in", []]], sortBy: 'list_price asc' },
            { name: _t("Brand Discounted Products"), icon: 'fa fa-slack bg-success-light text-success', desc: _t("This will show discounted products based on product pricelist from selected categories."), domain: ['&', ['dr_has_discount', '!=', false], ["dr_brand_value_id", "in", []]], sortBy: 'list_price asc' },
            { name: _t("Tags Discounted Products"), icon: 'dri dri-tag-l bg-success-light text-success', desc: _t("This will show discounted products based on product pricelist from selected tags."), domain: ['&', ['dr_has_discount', '!=', false], ["dr_tag_ids", "in", []]], sortBy: 'list_price asc' },
            { name: _t("Label Discounted Products"), icon: 'fa fa-bookmark-o bg-success-light text-success', desc: _t("This will show discounted products based on product pricelist from selected labels."), domain: ['&', ['dr_has_discount', '!=', false], ["dr_label_id", "in", []]], sortBy: 'list_price asc' },
            { name: _t("Best Seller"), icon: 'fa fa-cube bg-danger-light text-danger', desc: _t("This will show best seller products based on last 30 days sales."), domain: [], sortBy: 'bestseller' },
            { name: _t("Category Best Seller"), icon: 'dri dri-category bg-danger-light text-danger', desc: _t("This will show best seller products based on last 30 days sales from selected categories."), domain: [["public_categ_ids", "in", []]], sortBy: 'bestseller' },
            { name: _t("Brand Best Seller"), icon: 'fa fa-slack bg-danger-light text-danger', desc: _t("This will show best seller products based on last 30 days sales from selected brands."), domain: [["dr_brand_value_id", "in", []]], sortBy: 'bestseller' },
            { name: _t("Tags Best Seller"), icon: 'dri dri-tag-l bg-danger-light text-danger', desc: _t("This will show best seller products based on last 30 days sales from selected tags."), domain: [["dr_tag_ids", "in", []]], sortBy: 'bestseller' },
            { name: _t("Label Best Seller"), icon: 'fa fa-bookmark-o bg-danger-light text-danger', desc: _t("This will show best seller products based on last 30 days sales from selected label."), domain: [["dr_label_id", "in", []]], sortBy: 'bestseller' },
            { name: _t("Discounted Best Seller"), icon: 'fa fa-cube bg-warning-light text-warning', desc: _t("This will show best seller products with discount."), domain: [['dr_has_discount', '!=', false]], sortBy: 'bestseller' },
            { name: _t("Category Discounted Best Seller"), icon: 'dri dri-category bg-warning-light text-warning', desc: _t("This will show best seller products with discount from the selected categories."), domain: ['&', ["public_categ_ids", "in", []], ['dr_has_discount', '!=', false]], sortBy: 'bestseller' },
            { name: _t("Brand Discounted Best Seller"), icon: 'fa fa-slack bg-warning-light text-warning', desc: _t("This will show best seller products with discount from the selected brands."), domain: ['&', ["dr_brand_value_id", "in", []], ['dr_has_discount', '!=', false]], sortBy: 'bestseller' },
            { name: _t("Tags Discounted Best Seller"), icon: 'dri dri-tag-l bg-warning-light text-warning', desc: _t("This will show best seller products with discount from the selected tags."), domain: ['&', ["dr_tag_ids", "in", []], ['dr_has_discount', '!=', false]], sortBy: 'bestseller' },
            { name: _t("Label Discounted Best Seller"), icon: 'fa fa-bookmark-o bg-warning-light text-warning', desc: _t("This will show best seller products with discount from the selected label."), domain: ['&', ["dr_label_id", "in", []], ['dr_has_discount', '!=', false]], sortBy: 'bestseller' },
        ];
    },

    onClickChooseTemplate: function (ev) {
        var $target = $(ev.currentTarget);
        var selectedTemplate = this.getDomainTemplates()[$target.data('template-index')];
        _.invoke(this.ruleWidgets, 'destroy');
        this.ruleWidgets = [];
        this.domain = selectedTemplate.domain || [];
        if (selectedTemplate.sortBy) {
            this.$('#d_domain_sort_by_input').val(selectedTemplate.sortBy);
        }
        this._initDomainNodes();
    }
});

var DomainBuilderRow = Widget.extend({
    template: 'drg_domain_builder_row',
    events: {
        'click .drg_remove_rule': 'onRemoveRule',
        'change .db_input_field': 'onFieldChange',
        'change .db_input_operator': 'onOperatorChange',
        'click .pill_remove': 'onRemovePill'
    },
    init: function (parent, value) {
        this.ruleId = _.uniqueId('rule_');
        this.fields = this.getFieldList();
        this.value = value || [];
        this._super.apply(this, arguments);
    },
    start: function () {
        if (this.value.length) {  // INIT FIELD
            this.$('select.db_input_field').val(this.value[0]);
        }
        this.replaceOperator();
        if (this.value.length) { // INIT OPERATOR
            if (this.value[1] === '!=' && this.value[2] === false) {
                this.value[1] = 'set';
            } else if (this.value[1] === '=' && this.value[2] === false) {
                this.value[1] = 'not set';
            }
            this.$('select.db_input_operator').val(this.value[1]);
        }
        this.onFieldChange(false, !!this.value.length);
        if (this.value.length) { // INIT VALUE
            if (this.value[1] === 'in' || this.value[1] === 'not in' || this.value[1] === 'child_of') {
                this.initTagsIds = this.value[2]; // Loaded from initAutoComplete due to deferred data.
            } else if (this.value[2]) {
                this.$('.db_input_value').val(this.value[2]);
            }
        }
        return this._super.apply(this, arguments).then(() => {
            return this._initTags();
        });
    },
    getFieldList: function () {
        return [
            { 'type': 'text', 'name': 'name', 'label': _('Product Name') },
            { 'type': 'many2many', 'name': 'public_categ_ids', 'label': _('Product Category'), 'relationModel': 'product.public.category' },
            { 'type': 'many2one', 'name': 'dr_brand_value_id', 'label': _('Product Brand'), 'relationModel': 'product.attribute.value', 'extras': { 'brands': true } },
            { 'type': 'many2one', 'name': 'attribute_line_ids.value_ids', 'label': _('Product Attributes'), 'relationModel': 'product.attribute.value' },
            { 'type': 'many2one', 'name': 'dr_label_id', 'label': _('Product Label'), 'relationModel': 'dr.product.label' },
            { 'type': 'integer', 'name': 'list_price', 'label': _('Price') },
            { 'type': 'many2one', 'name': 'dr_tag_ids', 'label': _('Product Tags'), 'relationModel': 'dr.product.tags', 'is_multi_website': true },
            { 'type': 'boolean', 'name': 'dr_has_discount', 'label': _('Discount') },
        ];
    },
    getOperatorInfo: function () {
        return {
            'text': { 'ilike': "contains", 'not ilike': "doesn't contain", '=': "is equal to", '!=': "is not equal to" },
            'many2many': { 'in': "in", 'not in': "not in", 'child_of': "in child category of" },
            'many2one': { 'in': "in", 'not in': "not in" },
            'integer': { '=': "equals", '!=': "not in", '>': 'greater than', '<': 'less then' },
            'boolean': { 'set': 'is set', 'not set': 'is not set' }
        };
    },
    getSelectedFieldInfo: function () {
        var fieldList = this.getFieldList();
        var fieldName = this.$('select.db_input_field').val();
        return _.findWhere(fieldList, { 'name': fieldName });
    },
    getOperatorValue: function () {
        return this.$('select.db_input_operator').val();
    },
    getOperatorList: function () {
        var selectedFieldInfo = this.getSelectedFieldInfo();
        var operatorInfo = this.getOperatorInfo();
        return operatorInfo[selectedFieldInfo.type];
    },
    initAutoComplete: function (selectedFieldInfo) {
        this.$('.db_input_value').autocomplete({
            source: (request, response) => {
                var selectedIds = _.map(this.$('.pill_container .badge'), function (badge) { return parseInt(badge.id); }) || [];
                this._fetchRecords(selectedIds, selectedFieldInfo, request.term).then(data => {
                    response(data);
                });
            },
            select: this.onAutoCompleteChange.bind(this),
            disabled: false
        });
    },
    getValue: function () {
        var fieldName = this.$('.db_input_field').val();
        var operator = this.$('.db_input_operator').val();
        var selectedFieldInfo = this.getSelectedFieldInfo();
        var value = 0;
        if (operator === 'in' || operator === 'not in' || operator === 'child_of') {
            value = [];
            _.each(this.$('.pill_container .badge'), function (badge) {
                value.push(parseInt(badge.id));
            });
        } else {
            value = this.$('.db_input_value').val();
        }

        if (operator == 'set') {
            return [fieldName, '!=', false];
        }

        if (operator == 'not set') {
            return [fieldName, '=', false];
        }

        if (selectedFieldInfo.type === "integer") {
            return [fieldName, operator, parseInt(value)];
        } else if (selectedFieldInfo.type !== "integer") {
            return [fieldName, operator, value];
        }
    },

    _fetchRecords: async function (selectedIds, selectedFieldInfo, term) {
        let domain = term ? [['id', 'not in', selectedIds], ['name', 'ilike', term]] : [['id', 'in', selectedIds]];
        var records = await this._rpc({
            route: '/bean_theme/tp_search_read',
            params: {
                model: selectedFieldInfo.relationModel,
                domain: domain, fields: ['display_name', 'name', 'id'],
                extras: selectedFieldInfo.extras || {}
            }
        })
        return _.map(records, function (record) {
            return { value: record.id.toString(), label: record.display_name };
        });
    },

    _initTags: async function () {
        if (this.initTagsIds) {
            var selectedFieldInfo = this.getSelectedFieldInfo();
            var fatchedData = await this._fetchRecords(this.initTagsIds, selectedFieldInfo, false);
            _.each(fatchedData, tagData => {
                this.onAutoCompleteChange(false, { 'item': tagData });
            });
            this.initTagsIds = false;
        }
        return Promise.resolve();
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    onRemoveRule: function (ev) {
        ev.preventDefault();
        this.trigger_up('remove_rule', { ruleId: this.ruleId });
    },
    onFieldChange: function (ev, noReplace) {
        if (!noReplace) {
            this.replaceOperator();
        }
        this.$('select.db_input_operator').change();
        this.$('.db_input_value').val('');
        this.$('.pill_container .badge').remove();
    },
    replaceOperator: function () {
        var operatorInfo = this.getOperatorList();
        var $operators = qweb.render('drg_domain_builder_row_operator', { operators: operatorInfo });
        this.$('.db_input_operator').replaceWith($operators);
    },
    onAutoCompleteChange: function (ev, ui) {
        var self = this;
        if (ui.item && ui.item.label) {
            var $pill = qweb.render('drg_domain_builder_row_pill', ui.item);
            this.$('.db_input_value').before($pill);
            setTimeout(function () {
                self.$('.db_input_value').val('');
            }, 10);
        }
    },
    onRemovePill: function (ev) {
        $(ev.currentTarget).parent().remove();
    },
    onOperatorChange: function (ev) {
        var selectedOperator = this.getOperatorValue();
        var selectedFieldInfo = this.getSelectedFieldInfo();
        this.$(".db_value_col").toggleClass('d-none', _.contains(['not set', 'set'], selectedOperator));
        this.$(".db_input_value").autocomplete({ disabled: true });
        if (selectedOperator === 'in' || selectedOperator === 'not in' || selectedOperator === 'child_of') {
            this.initAutoComplete(selectedFieldInfo);
        } else {
            this.$('.pill_container .badge').remove();
        }
    }
});

registry.category("bean_theme_components").add("DomainBuilderComponent", DomainBuilder);

export default {
    DomainBuilder: DomainBuilder,
    DomainBuilderRow: DomainBuilderRow,
};