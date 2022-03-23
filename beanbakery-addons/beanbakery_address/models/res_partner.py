# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.tools.translate import _

from lxml import etree

class Partner(models.Model):
    _inherit = 'res.partner'
    def _get_country_VN(self):
        self.country_id = 241
    
    def _makeaddress(self,ward_name = "", district_name = ""):
        if (ward_name != False and district_name !=False):
            return (str(ward_name) + ", " + str(district_name))
        else:
            return ""
    
    @api.onchange('district_id')
    def _district_onchange(self):
        print(self.ward_id.name)
        if (self.ward_id.name):
            self.street2 = self._makeaddress(ward_name = self.ward_id.name , district_name = self.district_id.name)
        else:
            self.street2 = self._makeaddress(district_name = self.district_id.name)
    
    @api.onchange('ward_id')
    def _ward_onchange(self):
        if (self.district_id.name):
            self.street2 = self._makeaddress(ward_name= self.ward_id.name , district_name= self.district_id.name)
        else:
            self.street2 = self._makeaddress(ward_name = self.district_id.name)
    
    @api.onchange('city_id')
    def _onchange_city_id(self):
        if self.city_id:
            self.city = self.city_id.name
            self.zip = self.city_id.zipcode
            self.state_id = self.city_id.state_id
        elif self._origin:
            self.city = False
            self.zip = False
            self.state_id = False

    @api.model
    def _address_fields(self):
        """Returns the list of address fields that are synced from the parent."""
        return super(Partner, self)._address_fields() + ['city_id',]

    @api.model
    def _fields_view_get_address(self, arch):
        arch = super(Partner, self)._fields_view_get_address(arch)
        # render the partner address accordingly to address_view_id
        doc = etree.fromstring(arch)
        if doc.xpath("//field[@name='city_id']"):
            return arch

        replacement_xml = """
            <div>
                <field name="country_enforce_cities" invisible="1"/>
                <field name='city' placeholder="%(city_placeholder)s" 
                    attrs="{
                        'invisible': [('country_enforce_cities', '=', True), '|', ('city_id', '!=', False), ('city', 'in', ['', False ])],
                        'readonly': [('type', '=', 'contact')%(parent_condition)s]
                    }"%(required)s
                />
                <field name='city_id' placeholder="Please choose a %(city_placeholder)s" string="%(city_placeholder)s" 
                    context="{'default_country_id': country_id,
                              'default_name': city,
                              'default_zipcode': zip,
                              'default_state_id': state_id}"
                    domain="[('country_id', '=', country_id)]"
                    attrs="{
                        'invisible': [('country_enforce_cities', '=', False)],
                        'readonly': [('type', '=', 'contact')%(parent_condition)s]
                    }"
                />
                <field name="district_id" 
                    placeholder="Please choose a %(district_placeholder)s" string="%(district_placeholder)s"
                    options='{"no_open": True}' 
                    class="oe_edit_only" 
                />
                
                <field name="ward_id" 
                placeholder="Please choose a %(ward_placeholder)s" string="%(ward_placeholder)s"
                options='{"no_open": True}' 
                class="oe_edit_only"
                />
                <br/>
            </div>
        """

        replacement_data = {
            'city_placeholder': _('City'),
            'district_placeholder': _('District'),
            'ward_placeholder': _('Ward'),
        }

        def _arch_location(node):
            in_subview = False
            view_type = False
            parent = node.getparent()
            while parent is not None and (not view_type or not in_subview):
                if parent.tag == 'field':
                    in_subview = True
                elif parent.tag in ['list', 'tree', 'kanban', 'form']:
                    view_type = parent.tag
                parent = parent.getparent()
            return {
                'view_type': view_type,
                'in_subview': in_subview,
            }

        for city_node in doc.xpath("//field[@name='city']"):
            location = _arch_location(city_node)
            replacement_data['parent_condition'] = ''
            replacement_data['required'] = ''
            if location['view_type'] == 'form' or not location['in_subview']:
                replacement_data['parent_condition'] = ", ('parent_id', '!=', False)"
            if 'required' in city_node.attrib:
                existing_value = city_node.attrib.get('required')
                replacement_data['required'] = f' required="{existing_value}"'

            replacement_formatted = replacement_xml % replacement_data
            for replace_node in etree.fromstring(replacement_formatted).getchildren():
                city_node.addprevious(replace_node)
            parent = city_node.getparent()
            parent.remove(city_node)

        arch = etree.tostring(doc, encoding='unicode')
        return arch
    
    @api.model
    def default_get(self, default_fields):
        """Set default value by fileds """
        values = super(Partner,self).default_get(default_fields)
        values.update({
            "country_id":  241,
        })
        return values
        
    country_enforce_cities = fields.Boolean(related='country_id.enforce_cities', readonly=True)
    city_id = fields.Many2one(comodel_name='res.city', string='City of Address')
    district_id = fields.Many2one( comodel_name='res.country.district',string='District',domain="[('city_id','=', city_id)]")
    ward_id = fields.Many2one(comodel_name='res.country.ward',string='Ward',domain="[('district_id', '=', district_id)]")
        
    



