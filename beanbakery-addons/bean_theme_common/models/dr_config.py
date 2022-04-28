# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

import json
import logging
from odoo import _, api, fields, models, tools
from odoo.http import request

_logger = logging.getLogger(__name__)


class DrThemeConfig(models.Model):
    _name = 'dr.theme.config'
    _description = 'BeanBakery Theme Config'
    _rec_name = 'key'

    key = fields.Char(required=True)
    value = fields.Char()
    website_id = fields.Many2one('website')

    @api.model_create_multi
    def create(self, vals_list):
        self.clear_caches()
        return super(DrThemeConfig, self).create(vals_list)

    def write(self, vals):
        self.clear_caches()
        res = super(DrThemeConfig, self).write(vals)
        return res

    @api.model
    @tools.ormcache('website_id')
    def _get_all_config(self, website_id):
        result_configs = self._get_default_theme_config(website_id)
        all_config = self.search([('website_id', '=', website_id)])
        for config in all_config:
            try:
                if config.key.startswith('bool_'):
                    result_configs[config.key] = config.value == 'True'
                elif config.key.startswith('json_'):
                    config_value = json.loads(config.value)
                    if isinstance(config_value, dict):
                        result_configs[config.key].update(config_value)
                    else:
                        result_configs[config.key] = config_value
                elif config.key.startswith('int_'):
                    result_configs[config.key] = int(config.value)
                elif config.key.startswith('float_'):
                    result_configs[config.key] = float(config.value)
                else:
                    result_configs[config.key] = config.value
            except json.decoder.JSONDecodeError:
                _logger.warning("Bean Theme Config: Cannot parse '%s' with value '%s' ", config.key, config.value)
            except ValueError:
                _logger.warning("Bean Theme Config: Cannot parse '%s' with value '%s' ", config.key, config.value)
        return result_configs

    def _get_default_theme_config(self, website_id):
        website = self.env['website'].sudo().browse(website_id)

        return {
            'bool_enable_ajax_load': False,
            'json_zoom': {'zoom_enabled': True, 'zoom_factor': 2, 'disable_small': False},
            'json_category_pills': {'enable': True, 'enable_child': True, 'hide_desktop': True, 'show_title': True, 'style': '1'},
            'json_grid_product': {'show_color_preview': True, 'show_quick_view': True, 'show_similar_products': True, 'show_rating': True, 'style': '2'},
            'json_shop_filters': {'filter_method': 'default', 'in_sidebar': False, 'collapsible': True, 'show_category_count': True, 'show_attrib_count': False, 'hide_extra_attrib_value': False, 'show_rating_filter': True, 'tags_style': '1'},
            'json_bottom_bar': {'show_bottom_bar': True, 'show_bottom_bar_on_scroll': False, 'filters': True, 'actions': ['tp_home', 'tp_search', 'tp_wishlist', 'tp_offer', 'tp_brands', 'tp_category', 'tp_orders']},
            'bool_sticky_add_to_cart': True,
            'json_general_language_pricelist_selector': {'hide_country_flag': False},
            'json_mobile': {},
            'json_product_search': {'advance_search': True, 'search_category': True, 'search_attribute': True, 'search_suggestion': True, 'search_limit': 10, 'search_max_product': 3, 'search_fuzzy': True},
            'json_lazy_load_config': {'enable_ajax_load_products': False, 'enable_ajax_load_products_on_click': True},
            'json_brands_page': {'disable_brands_grouping': False},
            'cart_flow': 'default',
            'theme_installed': website.theme_id and website.theme_id.name.startswith('bean_theme') or False,
            'pwa_active': website.dr_pwa_activated,
            'bool_product_offers': True,
        }

    def _save_config(self, website_id, configs):
        all_config = self.search([('website_id', '=', website_id)])
        for key, value in configs.items():
            key, value = self._prepare_value_for_write(key, value)
            config = all_config.filtered(lambda c: c.key == key)
            if config:
                config.value = value
            else:
                self.create({'key': key, 'value': value, 'website_id': website_id})
        return True

    def _prepare_value_for_write(self, key, value):
        if key.startswith('json_'):
            value = json.dumps(value)
        elif key.startswith('int_'):
            value = value
        return key.strip(), value


class Http(models.AbstractModel):
    _inherit = 'ir.http'

    @api.model
    def get_dr_theme_config(self):
        if request.website:
            return request.website._get_dr_theme_config()
        return {}
