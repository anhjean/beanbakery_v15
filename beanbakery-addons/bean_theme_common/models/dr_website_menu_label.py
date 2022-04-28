# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models


class DrWebsiteMenuLabel(models.Model):
    _name = 'dr.website.menu.label'
    _description = 'Website Menu Label'

    name = fields.Char(required=True, translate=True)
    background_color = fields.Char('Background Color', default='#000000')
    text_color = fields.Char('Text Color', default='#FFFFFF')


class WebsiteMenu(models.Model):
    _inherit = 'website.menu'

    dr_menu_label_id = fields.Many2one('dr.website.menu.label', string='Label')
    dr_is_special_menu = fields.Boolean()  # To remove in v16
    dr_highlight_menu = fields.Selection([('solid', 'Solid'), ('soft', 'Soft')], string='Highlight Menu')

    @api.model
    def get_tree(self, website_id, menu_id=None):
        result = super(WebsiteMenu, self).get_tree(website_id, menu_id)
        for menu in result['children']:
            menu['fields']['dr_highlight_menu'] = self.browse(menu['fields']['id']).dr_highlight_menu
        return result
