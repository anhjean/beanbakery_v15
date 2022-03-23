
import logging
import random

from odoo.addons.website_sale.models.sale_order import SaleOrder


_logger = logging.getLogger(__name__)

"""Override _cart_accessories totally"""
def _cart_accessories(self): 
    """ Suggest accessories based on 'Accessory Products' of products in cart """
    for order in self:    
        products = order.website_order_line.mapped('product_id')
        _logger.debug("\n %s \n",products)
        accessory_products = self.env['product.product']
        accessory_products_cate = self.env['product.product']
            
        for line in order.website_order_line.filtered(lambda l: l.product_id):
            _logger.debug("\n accessory products: %s \n",line.product_id.categ_id._get_website_accessory_product())
            combination = line.product_id.product_template_attribute_value_ids + line.product_no_variant_attribute_value_ids
            accessory_products |= line.product_id.product_tmpl_id._get_website_accessory_product().filtered(lambda product:
                product not in products and
                product._is_variant_possible(parent_combination=combination) and
                (product.company_id == line.company_id or not product.company_id)
                )
            #load the accessory products of category    
            accessory_products_cate |= line.product_id.categ_id._get_website_accessory_product().filtered(lambda product:
                product not in products and
                product._is_variant_possible(parent_combination=combination) and
                (product.company_id == line.company_id or not product.company_id)
                )
           
            if  len(accessory_products_cate) !=0:
                _logger.debug("\n Type of: %s \n",type(accessory_products_cate))
                _logger.debug("\n accessory products have filter: %s \n"),accessory_products_cate[0]
                for item in accessory_products_cate:
                    _logger.debug("\n accessory products have filter: %s \n",item)
                    # add the accessory products of category 
                    # if the category's accessory is the same as product's accesory, it's will not be added
                    if item not in accessory_products:
                        accessory_products= accessory_products + item
                _logger.debug("\n accessory products have filter: %s \n",accessory_products)
    return random.sample(accessory_products, len(accessory_products))    
        
SaleOrder._cart_accessories = _cart_accessories
