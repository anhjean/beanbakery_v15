# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.tools.translate import translate


class beanbakery_product_category(models.Model):
    _inherit = 'product.category'

    description = fields.Text("Description",translate=True)
    accessory_product_ids = fields.Many2many(
        'product.product',  'product_category_accessory_rel', 'category_id', 'accessory_id', string='Accessory Products', 
        help='Accessories show up when the customer reviews the cart before payment (cross-sell strategy).')
    
    def _get_website_accessory_product(self):
        domain = self.env['website'].sale_product_domain()
        return self.accessory_product_ids.filtered_domain(domain)
#     _name = 'beanbakery_product_category.beanbakery_product_category'
#     _description = 'beanbakery_product_category.beanbakery_product_category'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100


#                <field name="accessory_product_ids" widget="many2many_tags" attrs="{'invisible': [('sale_ok','=',False)]}"
#                       placeholder="Suggested accessories in the eCommerce cart"/>
