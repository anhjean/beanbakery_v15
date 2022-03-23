# -*- coding: utf-8 -*-
# from odoo import http


# class BeanbakeryProductCategory(http.Controller):
#     @http.route('/beanbakery_product_category/beanbakery_product_category', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/beanbakery_product_category/beanbakery_product_category/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('beanbakery_product_category.listing', {
#             'root': '/beanbakery_product_category/beanbakery_product_category',
#             'objects': http.request.env['beanbakery_product_category.beanbakery_product_category'].search([]),
#         })

#     @http.route('/beanbakery_product_category/beanbakery_product_category/objects/<model("beanbakery_product_category.beanbakery_product_category"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('beanbakery_product_category.object', {
#             'object': obj
#         })
