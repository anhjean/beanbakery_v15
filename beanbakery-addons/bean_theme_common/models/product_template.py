# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models, Command


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    dr_label_id = fields.Many2one('dr.product.label', string='Label')
    # To remove in v16
    dr_brand_id = fields.Many2one('dr.product.brand')
    dr_offer_ids = fields.One2many('dr.product.offer', 'product_id', help='Display in product detail page on website.')
    dr_tab_ids = fields.One2many('dr.product.tabs', 'product_id', help='Display in product detail page on website.')

    dr_product_tab_ids = fields.Many2many('dr.website.content', 'product_template_tab_rel', 'product_template_id', 'tab_id', string='Tabs')
    dr_product_offer_ids = fields.Many2many('dr.website.content', 'product_template_offer_rel', 'product_template_id', 'offer_id', string='Offers')

    dr_tag_ids = fields.Many2many('dr.product.tags', 'dr_product_tags_rel', 'product_id', 'tag_id', string='Tags')
    dr_document_ids = fields.Many2many('ir.attachment', 'product_template_document_attachment_rel', 'product_template_id', 'attachment_id', string='Documents', help='Documents publicly downloadable from eCommerce product page.')
    dr_brand_value_id = fields.Many2one('product.attribute.value', compute='_compute_dr_brand_value_id', inverse='_inverse_dr_brand_value_id', search='_search_dr_brand_value_id', string='Brand')
    dr_brand_attribute_ids = fields.Many2many('product.attribute', compute='_compute_dr_brand_attribute_ids')

    @api.model
    def create(self, vals):
        res = super(ProductTemplate, self).create(vals)
        res.dr_document_ids.public = True
        return res

    def write(self, vals):
        res = super().write(vals)
        if 'dr_document_ids' in vals:
            self.dr_document_ids.public = True
        return res

    def _search_dr_brand_value_id(self, operator, value):
        if operator in ['in', 'not in']:
            return [('attribute_line_ids.value_ids', operator, value)]

        if operator in ['ilike', 'not ilike', '=', '!=']:
            brand_attribute_id = self._get_brand_attribute()
            values = self.env['product.attribute.value'].search([('name', operator, value), ('attribute_id', 'in', brand_attribute_id.ids)])
            return [('attribute_line_ids.value_ids', 'in', values.ids)]

        # do not support other cases
        return []

    def _compute_dr_brand_value_id(self):
        for product in self:
            brand_lines = product.attribute_line_ids.filtered(lambda x: x.attribute_id.dr_is_brand)
            product.dr_brand_value_id = self.env['product.attribute.value']
            if brand_lines:
                product.dr_brand_value_id = brand_lines[0].value_ids[0]

    def _inverse_dr_brand_value_id(self):
        brand_lines = self.attribute_line_ids.filtered(lambda x: x.attribute_id.dr_is_brand)
        brand_line = brand_lines and brand_lines[0]
        if brand_line and self.dr_brand_value_id:
            brand_line.value_ids = self.dr_brand_value_id
        elif brand_line and not self.dr_brand_value_id:
            brand_line.unlink()
        elif self.dr_brand_value_id:
            self.env['product.template.attribute.line'].create({
                'product_tmpl_id': self.id,
                'attribute_id': self.dr_brand_value_id.attribute_id.id,
                'value_ids': [Command.set(self.dr_brand_value_id.ids)],
            })

    def _compute_dr_brand_attribute_ids(self):
        attributes = self._get_brand_attribute()
        for product in self:
            product.dr_brand_attribute_ids = attributes

    def _get_brand_attribute(self):
        return self.env['product.attribute'].search([('dr_is_brand', '=', True)])

    @api.model
    def _search_get_detail(self, website, order, options):
        res = super()._search_get_detail(website, order, options)
        if self.env.context.get('tp_shop_args'):
            args = self.env.context.get('tp_shop_args')
            # Tag
            tag = args.getlist('tag')
            if tag:
                res['base_domain'].append([('dr_tag_ids', 'in', [int(x) for x in tag])])
            # Rating
            ratings = args.getlist('rating')
            if ratings:
                result = self.env['rating.rating'].sudo().read_group([('res_model', '=', 'product.template')], ['rating:avg'], groupby=['res_id'], lazy=False)
                rating_product_ids = []
                for rating in ratings:
                    rating_product_ids.extend([item['res_id'] for item in result if item['rating'] >= int(rating)])
                if rating_product_ids:
                    res['base_domain'].append([('id', 'in', rating_product_ids)])
                else:
                    res['base_domain'].append([('id', 'in', [])])
        return res

    @api.onchange('website_id')
    def _onchange_website_id(self):
        self.dr_label_id = False
        self.dr_tag_ids = False

    @api.model
    def _get_product_colors(self):
        color_variants = self.attribute_line_ids.filtered(lambda x: x.attribute_id.display_type == 'color')
        if len(color_variants) == 1:
            if len(color_variants.value_ids) == 1:
                return []
            return color_variants.value_ids.mapped('html_color')
        return []

    @api.model
    def _get_product_pricelist_offer(self):
        partner = self._context.get('partner')
        pricelist_id = self._context.get('pricelist')
        pricelist = self.env['product.pricelist'].browse(pricelist_id)

        price_rule = pricelist._compute_price_rule([(self, 1, partner)])
        price_rule_id = price_rule.get(self.id)[1]
        if price_rule_id:
            rule = self.env['product.pricelist.item'].browse([price_rule_id])
            if rule and rule.date_end:
                return {'rule': rule, 'date_end': rule.date_end.strftime('%Y-%m-%d %H:%M:%S')}
        return False
