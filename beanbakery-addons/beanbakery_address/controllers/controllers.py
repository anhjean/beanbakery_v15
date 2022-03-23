# -*- coding: utf-8 -*-
# from odoo import http


# class BeanbakeryAddress(http.Controller):
#     @http.route('/beanbakery_address/beanbakery_address', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/beanbakery_address/beanbakery_address/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('beanbakery_address.listing', {
#             'root': '/beanbakery_address/beanbakery_address',
#             'objects': http.request.env['beanbakery_address.beanbakery_address'].search([]),
#         })

#     @http.route('/beanbakery_address/beanbakery_address/objects/<model("beanbakery_address.beanbakery_address"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('beanbakery_address.object', {
#             'object': obj
#         })
