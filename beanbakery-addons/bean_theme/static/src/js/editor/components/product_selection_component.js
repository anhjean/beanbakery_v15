/** @odoo-module alias=bean_theme.product_selection_component */

import { _t } from 'web.core';
import AbstractComponent from '@bean_theme/js/editor/components/abstract_component';
import { registry } from '@web/core/registry';

let ProductsSelectionComponent = AbstractComponent.extend({

    template: 'bean_theme.product_selection_component',

    xmlDependencies: AbstractComponent.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/editor/components/product_selection_component.xml']),

    events: {
        'click .tp-confirm-selection': '_onConfirmSelection'
    },

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * @override
     * @returns {Array} list of selected products / domain with it state
     */
    ComponentCurrentState: function () {
        let result = {
            selectionType: this.selectionType,
        };
        switch (this.selectionType) {
            case 'manual':
                result['recordsIDs'] = this._getComponentState('productSelection');
                break;
            case 'advance':
                result['domain_params'] = this._getComponentState('DomainBuilder');
                break;
        }
        return result;
    },
    /**
     * @constructor
     * @param {Object} options: useful parameters such as recordsIDs, domain etc.
     */
    setWidgetState: function (options) {
        this._super.apply(this, arguments);
        options = options || {};
        this.domain_params = options.domain_params || false;
        this.recordsIDs = options.recordsIDs || [];
        this.model = options.model || 'product.template';
        this.subModel = options.subModel || 'product.template';
        this.selectionType = options.selectionType || 'manual';
        this.noSwicher = options.noSwicher || false;
        this.noConfirmBtn = options.noConfirmBtn || false;
        this.recordsLimit = options.recordsLimit || 0;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @constructor
     * @param {String} value
     */
    _activateComponent: function (value) {
        this.$('.tp-product-selection-component').addClass('d-none');
        this.$('.tp-product-selection-component[data-selection-mode='+ value +']').removeClass('d-none');
    },
    /**
     * @private
     * @returns {Array} recordsIDs
     */
    _getDefaultFieldValue: function () {
        return {
            selectionType: this._getDefaultValueSelectionType(),
            productSelection: this._getDefaultValuesProductSelection(),
            DomainBuilder: this.options.domain_params || {}
        };
    },
    /**
     * @private
     */
    _getDefaultValueSelectionType: function () {
        return {
            recordID: this.selectionType || 'manual',
            records: [{ id: 'manual', iconClass: 'fa fa-hand-pointer-o', title: _t('Manual Selection')},
                { id: 'advance', iconClass: 'fa fa-cogs', title: _t('Advance Selection')}]
        };
    },
    /**
     * @private
     */
    _getDefaultValuesProductSelection: function () {
        let values = {
            recordsIDs: this.recordsIDs || [],
            routePath: '/bean_theme/tp_search_read',
            recordsLimit: this.options.recordsLimit || 20,
            model: this.model,
        };
        switch (this.model) {
            case 'product.template':
                _.extend(values, this._getProductTemplateConfig());
                break;
            case 'product.public.category':
                _.extend(values, this._getCategoryConfig());
                break;
        }
        return values;
    },
    /**
     * @private
     */
    _getCategoryConfig: function () {
        return {
            fields: ['name', 'display_name', 'id', 'dr_category_label_id'],
            dropdownTemplate: 'bean_theme.category_selection_dropdown_item',
            listTemplate: 'bean_theme.selected_category_item'
        };
    },
    /**
     * @private
     */
    _getProductTemplateConfig: function () {
        return {
            fields: ['name', 'dr_brand_value_id', 'public_categ_ids', 'description_sale', 'rating'],
            fieldsToMarkUp: ['price', 'list_price', 'rating'],
            dropdownTemplate: 'bean_theme.product_selection_dropdown_item',
            listTemplate: 'bean_theme.selected_product_item'
        };
    },
    /**
     * @private
     * @param {OdooEvent} ev
     */
    _onChangeComponentValue: function (ev) {
        let { fieldName, value } = ev.data;
        switch (fieldName) {
            case 'selectionType':
                this.selectionType = value;
                this._activateComponent(value);
                this.$('.tp-confirm-selection').prop('disabled', value === 'manual' && !this._getComponentState('productSelection').length);
                break;
            case 'productSelection':
                this.$('.tp-confirm-selection').prop('disabled', !value.length);
                break;
        }
    },
    _onConfirmSelection: function () {
        this.trigger_up('tp_confirm_changes', { fieldName: this.fieldName, value: this.ComponentCurrentState() });
    }
});

registry.category("bean_theme_components").add("ProductsSelectionComponent", ProductsSelectionComponent);

export default { ProductsSelectionComponent };
