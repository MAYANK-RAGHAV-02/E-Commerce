const Product = require('../models/product');
const user = require('../models/user');
const order = require('../models/order');
const product = require('../models/product');
const { checkout } = require('../routes/shop');
const PAGE_PER_ITEM = 2;
const stripe = require('stripe')('sk_test_51JibrQSHzetXL1mYm6qPvIfB4I5W8bNvJZVkePDcV9R4OdrXiE2uY3zkmfYgds3ZlqfkSOy9oVPshQtwAHmrRmt600sYyWnAe1');
exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      // console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)

    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * PAGE_PER_ITEM)
        .limit(PAGE_PER_ITEM)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: PAGE_PER_ITEM * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / PAGE_PER_ITEM),
        
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items;
      // console.log(products)
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      req.user.addToCart(product);
    })
    .then(result => {
      // console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeItemCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {

  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }
      })
      const orders = new order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      })
      return orders.save()
    })

    .then(result => {
      req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
}


exports.getOrders = (req, res, next) => {
  order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then(user => {
      products = user.cart.items;
       total= 0;
      products.forEach(element => {
        total += element.quantity * element.productId.price;
        
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p=>{
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price*100,
            currency: 'inr',
            quantity: p.quantity
            
          }
        }),
        success_url: req.protocol + '://'+ req.get('host')+ '/checkout/success',
        cancel_url: req.protocol + '://'+ req.get('host')+ '/checkout/cancel'
      })
    })
    .then(session =>{
      // console.log(products);
      // console.log(session);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Your Cart',
       
        products: products,
        totalSum:  total,
        sessionId: session.id ,
      });
    })
    .catch(err => console.log(err));
};