const {policyFor} = require('../policy/index');
const Product = require('../product/model');
const CartItem = require('../cart-item/model');

async function update(req, res, next){

    //TODO cek policy
    let policy = policyFor(req.user);

    if(!policy.can('update', 'Cart')){
        return res.json({
            error:1,
            message: 'You are not allowed to perform this action'
        })
    }

    try {
        
        const {items} = req.body;

        //ekstrak _id dari masing" item
        const productIds = items.map(itm => itm._id); 

        //cari data _id pada produk
        const products = await Product.find({_id: {$in: productIds}});

        let cartItems = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item._id);

            return {
                _id: relatedProduct._id,
                product: relatedProduct._id,
                price: relatedProduct.price,
                image_url: relatedProduct.image_url,
                name: relatedProduct.name,
                user: req.user._id,
                qty: item.qty
            }
        })

        await CartItem.deleteMany({user: req.user._id});

        await CartItem.bulkWrite(cartItems.map(item => {
            return {
                updateOne: {
                    filter: {user: req.user._id, product: item.product},
                    update: item,
                    upsert: true
                }
            }
        }));

        return res.json(cartItems);
    } catch (error) {
        
        if(error && error.name === 'ValidationError'){
            return res.json({
                error:1,
                message: error.message,
                fields: error.errors
            })
        };

        next(error);
    }
}

async function index(req, res, next) {

    //TODO cek policy
    let policy = policyFor(req.user);

    if(!policy.can('read', 'Cart')){
        return res.json({
            error:1,
            message:'You are not allowed to perform this action'
        })
    }

    try {
        
        let items = await CartItem.find({user: req.user._id}).populate('product');

        return res.json(items);
    } catch (error) {

        if(error && error.name === 'ValidationError'){
            return res.json({
                error:1,
                message: error.message,
                fields: error.errors
            })
        }

        next(error);     
    }
}

module.exports = {
    update, index
}