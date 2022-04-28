/** @odoo-module alias=bean_theme.selection_component */
import concurrency from 'web.concurrency';
import { registry } from '@web/core/registry';
import { qweb } from 'web.core';
import AbstractComponent from '@bean_theme/js/editor/components/abstract_component';
import { MarkupRecords } from 'bean_theme.mixins';

let SelectionComponent = AbstractComponent.extend(MarkupRecords, {
    template: 'bean_theme.selection_component',

    xmlDependencies: AbstractComponent.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/editor/components/selection_component.xml']),
    events: {
        'input .tp-search-input': '_onSearchInput',
        'keydown .tp-search-input': '_onSearchInputKeydown',
        'focusout': '_onElementFocusOut',
        'click .tp-dropdown-item, .tp-add-record': '_onItemSelect',
        'click .tp-remove-item': '_onRemoveRecord',
    },

    /**
     * @constructor
     */
    init: function (parent, params) {
        this._super.apply(this, arguments);
        this._dp = new concurrency.DropPrevious();
        this._onSearchInput = _.debounce(this._onSearchInput, 400);
        this._onElementFocusOut = _.debounce(this._onElementFocusOut, 100);
        this.params = params || {};
        this.listTemplate = this.params.listTemplate;
        this.recordsIDs = this.params.recordsIDs || [];
        this.recordsLimit = this.params.recordsLimit || 20;
        this.records = [];
        this.suggestions = [];
    },
    /**
     * @override
     */
    willStart: async function () {
        const res = this._super(...arguments);
        if (this.recordsIDs && this.recordsIDs.length) {
            let params = _.extend(this._getDefaultParams(), {domain: this._getRecordsDomain()});
            let [fetchedRecords, anotherResult] = await Promise.all([this._fetchRecords(params) || {}, this._fetchSuggestions()]);
            this.records = this._markUpData(fetchedRecords);
            this.recordsIDs = _.map(this.records, (record) => record.id);
        } else {
            await this._fetchSuggestions();
        }
        return res;
    },
    /**
     * @override
     */
    start: function () {
        this.$input = this.$('.tp-search-input');
        this._makeRecordsSortable();
        this._refreshRecordsList();
        this._renderSuggestions();
        return this._super(...arguments);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * Hide dropdown and clear input field
     */
    _clearAutoComplete: function () {
        this.$('.tp-search-input').val('');
        this.$('.tp-auto-complete-dropdown-menu').removeClass('show').empty();
    },
    /**
     * @private
     * @return default data for RPC
     */
    _getDefaultParams: function () {
        return {
            model: this.params.model,
            fields: this.params.fields,
            routePath: this.params.routePath,
        }
    },
    /**
     * @private
     * @return {Array} return domain which having selected records IDs
     */
    _getRecordsDomain: function (recordIds) {
        let recordIDs = recordIds || this.recordsIDs;
        return [['id', 'in', recordIDs]];
    },
    /**
     * @private
     * @param term Searched string in input
     * @return {Array} returns domain that having searched term
     */
    _getSearchDomain: function (term) {
        if (term) {
            return [['id', 'not in', this.recordsIDs], ['name', 'ilike', term]];
        }
        return [['id', 'not in', this.recordsIDs]];
    },
    /**
     * @private
     * @return {Boolean} returns user able to select next record or not
     */
    _isReachedToLimit: function () {
        return this.recordsIDs.length >= this.recordsLimit;
    },
    /**
     * @private
     */
    _makeRecordsSortable: function () {
        this.$('.tp-selected-record-list').nestedSortable({
            listType: 'ul',
            protectRoot: true,
            handle: '.tp-sortable-handle',
            items: 'li',
            toleranceElement: '> .row',
            forcePlaceholderSize: true,
            opacity: 0.6,
            tolerance: 'pointer',
            placeholder: 'tp-drag-placeholder mt-2',
            maxLevels: 0,
            expression: '()(.+)',
            relocate: this._onRearrangeItems.bind(this)
        });
    },
    /**
     * @private
     * @param operation {String} possible values (add/delete)
     * @param recordID {Integer} ID of record
     * Update widget state accordingly
     */
    _widgetNotifyChanges: async function (operation, recordID) {
        switch (operation) {
            case 'add':
                if (!this._isReachedToLimit() && !_.contains(this.recordsIDs, recordID)) {
                    this.recordsIDs.push(recordID);
                    let params = _.extend(this._getDefaultParams(), { domain: this._getRecordsDomain([recordID]) });
                    let [fetchedRecords, anotherResult] = await Promise.all([this._fetchRecords(params) || {}, this._refreshSuggestions()]);
                    let markedUpData = this._markUpData(fetchedRecords);
                    this.records.push(markedUpData[0]);
                }
                break;
                case 'delete':
                    this.recordsIDs = _.without(this.recordsIDs, recordID);
                    await this._refreshSuggestions();
                    break;
                }
        this._refreshRecordsList();
        this.trigger_up('tp_component_value_changed', { fieldName: this.fieldName, value: this.recordsIDs });
    },
    ComponentCurrentState: function () {
        return this.recordsIDs || [];
    },
    /**
     * @private
     * @param data {records}
     */
    _renderDropdown: function (records) {
        var data = this._markUpData(records);
        let {dropdownTemplate} = this.params;
        if (dropdownTemplate) {
            var $menu = $(qweb.render('bean_theme.tp_autocomplete_dropdown_item', {
                dropdownTemplate: dropdownTemplate,
                records: data,
                term: this.$('.tp-search-input').val()
            }));
            this.$('.tp-auto-complete-dropdown-menu').addClass('show').empty().append($menu);
            this.$menu = this.$('.tp-auto-complete-dropdown-menu');
        }
    },
    /**
     * @private
     * @param {data} Data
     */
    _markUpData: function (data) {
        let {fieldsToMarkUp} = this.params;
        if (fieldsToMarkUp) {
            return this._markUpValues(fieldsToMarkUp, data);
        }
        return data;
    },
    /**
     * @private
     * Rerender list
     */
    _refreshRecordsList: function () {
        this._processData();
        var $list = $(qweb.render(this.listTemplate, {widget: this}));
        this.$('.tp-selected-record-list').empty().append($list);
        this.$input.prop('disabled', this._isReachedToLimit());
        this.$('.tp-warning-alert').toggleClass('d-none', !this._isReachedToLimit());
        this.$('.tp-no-records-placeholder, .tp-selected-records-container').addClass('d-none');
        let selector = this.recordsIDs.length ? '.tp-selected-records-container' : '.tp-no-records-placeholder';
        this.$(selector).removeClass('d-none');
    },
    /**
     * @private
     * reorder records state based on recordIDs
     */
    _processData: function () {
        let records = _.map(this.recordsIDs, (record) => {
            return _.findWhere(this.records, { id: record });
        });
        this.records = _.compact(records); // compact is mandatory in case record is not available now.
    },

    /**
     * @private
     * fetch new data and render suggestions
     */
    _refreshSuggestions: async function () {
        await this._fetchSuggestions();
        this._renderSuggestions();
    },

    _fetchSuggestions: async function () {
        let defaultParams = this._getDefaultParams();
        defaultParams['routePath'] = `${defaultParams.routePath}/suggest`;
        let fetchedRecords = await this._fetchRecords(_.extend(defaultParams, { order: 'bestseller', domain: this._getSearchDomain()}));
        this.suggestions = this._markUpData(fetchedRecords || []);
        return this.suggestions;  // in case we need it in return
    },

    _renderSuggestions: async function () {
        var $suggestions = $(qweb.render('bean_theme.suggestions', {suggestions: this.suggestions, widget:this}));
        this.$('.tp-suggested-items').empty().append($suggestions);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
    * @private
    */
    _onElementFocusOut: function () {
        if (!this.$el.has(document.activeElement).length) {
            this._clearAutoComplete();
        }
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onItemSelect: function (ev) {
        ev.preventDefault();
        this._widgetNotifyChanges('add', parseInt($(ev.currentTarget).attr('data-id')));
        this._clearAutoComplete();
        this.$input.focus();
    },
    /**
     * @private
     */
    _onRearrangeItems: function () {
        this.recordsIDs = _.map(this.$('.tp-record-list-item'), function (item) {
            return parseInt($(item).attr('data-record-id'));
        });
        this._refreshRecordsList();
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onRemoveRecord: function (ev) {
        this._widgetNotifyChanges('delete', parseInt($(ev.currentTarget).attr('data-id')));
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onSearchInput: function (event) {
        let term = $(event.currentTarget).val();
        let params = _.extend(this._getDefaultParams(), { domain: this._getSearchDomain(term), limit: 5 });
        if (term) {
            this._dp.add(this._fetchRecords(params).then(this._renderDropdown.bind(this)));
        } else {
            this._clearAutoComplete();
        }
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onSearchInputKeydown: function (ev) {
        if ((ev.which === $.ui.keyCode.UP || ev.which === $.ui.keyCode.DOWN) && this.$menu) {
            ev.preventDefault();
            let $element = ev.which === $.ui.keyCode.UP ? this.$menu.children().last() : this.$menu.children().first();
            $element.focus();
        }
    },
});

registry.category("bean_theme_components").add("SelectionComponent", SelectionComponent);
export default SelectionComponent;