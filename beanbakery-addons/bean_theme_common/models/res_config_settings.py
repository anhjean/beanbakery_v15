# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models, _


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # This has been done in order to fix Odoo's broken behavior for theme customization.
    # If database already have theme installed, it is impossible to have custom module later.

    dr_has_custom_module = fields.Boolean(compute='_compute_dr_has_custom_module')

    @api.depends('website_id')
    def _compute_dr_has_custom_module(self):
        themes = self._get_BeanBakery_theme_list()
        for setting in self:
            if setting.website_id and setting.website_id.theme_id and setting.website_id.theme_id.name in themes:
                search_term = '%s_%%' % setting.website_id.theme_id.name
                has_custom_apps = self.env['ir.module.module'].sudo().search([('name', '=ilike', search_term)])
                if has_custom_apps:
                    setting.dr_has_custom_module = True
                else:
                    setting.dr_has_custom_module = False
            else:
                setting.dr_has_custom_module = False

    def dr_open_theme_custom_modules(self):
        self.ensure_one()
        themes = self._get_BeanBakery_theme_list()
        if self.website_id and self.website_id.theme_id and self.website_id.theme_id.name in themes:
            search_term = '%s_%%' % self.website_id.theme_id.name
            return {
                'name': _('Theme Customizations'),
                'view_mode': 'kanban,tree,form',
                'res_model': 'ir.module.module',
                'type': 'ir.actions.act_window',
                'domain': [('name', '=ilike', search_term)]
            }
        return True

    def _get_BeanBakery_theme_list(self):
        return ['bean_theme']
