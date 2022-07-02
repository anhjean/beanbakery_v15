from odoo import models, fields
from odoo.tools.translate import translate

class District(models.Model):
    # _name is the important field to define the global name of model
    _name = "res.country.district"
    # _descriptin is define the friendly name for model
    _description = "District"
    _order = "code"
    
    name = fields.Char('District name', translate=True)
    code = fields.Char(string="District Code",help='The District code.', required=True)
    slug = fields.Char(string="District Code ID")
    city_id = fields.Many2one(comodel_name='res.city',string='City',domain="[('state_id', '=', state_id)]")
    state_id = fields.Many2one(
        'res.country.state', 'State',domain="[('country_id', '=', country_id)]")
    country_id = fields.Many2one('res.country', string='Country', required=True, )
    zipcode = fields.Char(string='Zipcode',default='')
    
    def get_website_sale_district(self, mode='billing'):
        return self.sudo().search([])
   
    