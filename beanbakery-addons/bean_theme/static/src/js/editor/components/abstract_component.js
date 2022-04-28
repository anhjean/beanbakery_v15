/** @odoo-module alias=bean_theme.abstract_component */
import Widget from 'web.Widget';
import { _t } from 'web.core';
import { registry } from "@web/core/registry";
// My fu*king OWL :)
// Yes i know you're here to understand our system
// Light could be dream, light could be dream :)
var AbstractComponent = Widget.extend({
    xmlDependencies: [],
    custom_events: _.extend({}, Widget.prototype.custom_events, {
        tp_component_value_changed: '_onChangeComponentValue',
        tp_confirm_changes: '_onComponentConfirmChanges',
    }),
    /**
     * @constructor
     * @param {Object} options: useful parameters such as productIDs, domain etc.
     */
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.setWidgetState(options);
    },

    start: function () {
        this._appendSubComponents();
        return this._super.apply(this, arguments);
    },
    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * @returns {string}
     */
    ComponentCurrentState: function () {
        return {};
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _appendSubComponents: function () {
        let componentNodes = this.$("[data-component]");
        if (componentNodes.length) {
            this.allComponents = {};
            let values = this._getDefaultFieldValue() || {};
            _.each(componentNodes, componentElement => {
                let $component = $(componentElement);
                let componentName = $component.attr('data-component');
                let fieldName = $component.attr('data-field-name');
                let optionsValue = $component.attr('data-options');
                let options = optionsValue ? JSON.parse(optionsValue) : false;
                let PrimeComponent = registry.category("bean_theme_components").get(componentName);
                let componentObject = new PrimeComponent(this, _.extend({fieldName: fieldName}, values[fieldName], options));
                this.allComponents[fieldName] = componentObject;
                componentObject.appendTo($component);
            });
        }
    },

    /**
     * @private
     * @returns {Promise}
     */
    async _fetchRecords(params) {
        var { routePath, fields, domain, model, limit } = params;
        const res = await this._rpc({
            route: routePath,
            params: {
                'domain': domain,
                'fields': fields,
                'model': model,
                'limit': limit || 20,
            },
        });
        return res;
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     *
     * Set default values.
     * @abstract
     */
    setWidgetState: function (options) {
        this.options = options || {};
        this.fieldName = options.fieldName;
    },
    _filterResult: function (result) {
        return _.pick(result, (value, key, object) => {
            return _.contains(_.keys(this.allComponents), key);
        });
    },
    _getComponentByName: function (fieldName) {
        return _.find(this.allComponents, function (co, key) { return key === fieldName })
    },
    _getComponentState: function (componentName) {
        let componentObj = _.find(this.allComponents, function (value, key) { return key == componentName; });
        return componentObj ? componentObj.ComponentCurrentState() : false;
    },
    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
    * @private
    */
    _onChangeComponentValue: function (data) {},
    /**
    * @private
    */
    _onComponentConfirmChanges: function (data) {},
});

export default AbstractComponent;