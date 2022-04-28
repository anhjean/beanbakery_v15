# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models, _
from odoo.exceptions import UserError
from odoo.tools.translate import html_translate


class ProductAttribute(models.Model):
    _inherit = 'product.attribute'

    display_type = fields.Selection(
        selection_add=[
            ('radio_circle', 'Radio Circle'),
            ('radio_square', 'Radio Square'),
            ('radio_image', 'Radio Image'),
        ], ondelete={'radio_circle': 'cascade', 'radio_square': 'cascade', 'radio_image': 'cascade'})
    dr_is_show_shop_search = fields.Boolean('Show Searchbar in Shop Filter', default=False)
    dr_attribute_popup_id = fields.Many2one('dr.website.content', string='Popup', domain='[("content_type", "=", "attribute_popup")]')
    dr_radio_image_style = fields.Selection([
        ('default', 'Default'),
        ('image', 'Image'),
        ('image_text', 'Image + Text'),
    ], default='default', string='Style')
    dr_search_suggestion = fields.Selection([('auto', 'Autocomplete'), ('auto_suggestion', 'Autocomplete & Suggestion')], string="Search suggestion type")
    dr_is_brand = fields.Boolean('Is Brand?')

    @api.onchange('dr_is_brand')
    def _onchange_dr_is_brand(self):
        self.display_type = 'radio_image'

    @api.constrains('dr_is_brand', 'display_type')
    def _constrains_dr_is_brand(self):
        for attribute in self:
            if attribute.dr_is_brand and not attribute.display_type == 'radio_image':
                raise UserError(_('Brand attribute must have display type "Radio Image".'))

    def open_create_brand_value(self):
        return {
            'type': 'ir.actions.act_window',
            'name': _('Brand'),
            'res_model': 'product.attribute.value',
            'view_mode': 'form',
            'target': 'new',
            'views': [[False, 'form']],
            'context': {'default_attribute_id': self.id}
        }


class ProductAttributeValue(models.Model):
    _inherit = 'product.attribute.value'

    dr_image = fields.Binary(string='Image')
    dr_brand_description = fields.Text(string='Description', translate=True)


class ProductTemplateAttributeValue(models.Model):
    _inherit = 'product.template.attribute.value'

    dr_image = fields.Binary('Image', related='product_attribute_value_id.dr_image')
