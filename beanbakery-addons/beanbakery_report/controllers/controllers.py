# -*- coding: utf-8 -*-
# from odoo import http


# class BeanbakeryReport(http.Controller):
#     @http.route('/beanbakery_report/beanbakery_report', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/beanbakery_report/beanbakery_report/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('beanbakery_report.listing', {
#             'root': '/beanbakery_report/beanbakery_report',
#             'objects': http.request.env['beanbakery_report.beanbakery_report'].search([]),
#         })

#     @http.route('/beanbakery_report/beanbakery_report/objects/<model("beanbakery_report.beanbakery_report"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('beanbakery_report.object', {
#             'object': obj
#         })
