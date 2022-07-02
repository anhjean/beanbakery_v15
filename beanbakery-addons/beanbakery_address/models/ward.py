from odoo import models, fields, api

class Ward(models.Model):
    _name='res.country.ward'
    _description = 'ward'
    _order = 'name'

    
    code = fields.Char(string="Ward Code")
    slug = fields.Char(string="Ward Code ID")
    name = fields.Char("Ward name", translate=True)
    district_id = fields.Many2one('res.country.district', string='District',domain="[('city_id', '=', city_id)]")
    city_id = fields.Many2one(comodel_name='res.city',string='City',domain="[('state_id', '=', state_id)]")
    state_id = fields.Many2one(
        'res.country.state', 'State',domain="[('country_id', '=', country_id)]")
    country_id = fields.Many2one('res.country', string='Country', required=True, )
    zipcode = fields.Char(string='Zipcode',default='')
    