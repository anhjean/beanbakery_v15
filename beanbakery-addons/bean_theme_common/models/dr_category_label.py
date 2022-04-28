# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import fields, models, api


class DrWebsiteCategoryLabel(models.Model):
    _name = 'dr.product.public.category.label'
    _description = 'Category Label'

    name = fields.Char(required=True, translate=True)
    background_color = fields.Char('Background Color', default='#000000')
    text_color = fields.Char('Text Color', default='#FFFFFF')


class DrProductPublicCategory(models.Model):
    _inherit = 'product.public.category'

    dr_category_label_id = fields.Many2one('dr.product.public.category.label', string='Label')
    dr_category_cover_image = fields.Binary(string='Cover Image')
    dr_category_icon = fields.Binary(string='Icon Image')

    @api.model
    def _search_get_detail(self, website, order, options):
        "Fix the issue of Odoo's search in html fields"
        with_image = options['displayImage']
        options = options.copy()
        options['displayDescription'] = False
        result = super()._search_get_detail(website, order, options)
        if with_image:
            result['mapping']['image_url'] = {'name': 'image_url', 'type': 'html'}

        # to fix Odoo's issue Odoo catagory is not multi website compatible
        result['base_domain'] = [website.website_domain()]

        return result

